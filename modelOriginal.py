# This is the code for the original model javascript code found at: https:#facultyweb.cs.wwu.edu/~jagodzf/covid-19/original/
# written using Python 3.7.2
import datetime
import math
import plotly.express as px
from functools import reduce
from inspect import signature

Time_to_death = 32
logN = math.log(7e6)
N = 327000000
I0 = 1
R0 = 2.2
D_incbation = 5.2
D_infectious = 2.9
D_recovery_mild = 14 - 2.9
D_recovery_severe = 31.5 - 2.9
D_hospital_lag = 5
D_death = Time_to_death - D_infectious
CFR = 0.02
InterventionTime = 10000
InterventionAmt = 1 / 3
Time = 220
Xmax = 110000
dt = 2
P_SEVERE = 0.2
duration = 7 * 12 * 1e10

Integrators = {
    "Euler": [[1]],
    "Midpoint": [
        [0.5, 0.5],
        [0, 1],
    ],
    "Heun": [
        [1, 1],
        [0.5, 0.5],
    ],
    "Ralston": [
        [2 / 3, 2 / 3],
        [0.25, 0.75],
    ],
    "K3": [
        [0.5, 0.5],
        [1, -1, 2],
        [1 / 6, 2 / 3, 1 / 6],
    ],
    "SSP33": [
        [1, 1],
        [0.5, 0.25, 0.25],
        [1 / 6, 1 / 6, 2 / 3],
    ],
    "SSP43": [
        [0.5, 0.5],
        [1, 0.5, 0.5],
        [0.5, 1 / 6, 1 / 6, 1 / 6],
        [1 / 6, 1 / 6, 1 / 6, 1 / 2],
    ],
    "RK4": [
        [0.5, 0.5],
        [0.5, 0, 0.5],
        [1, 0, 0, 1],
        [1 / 6, 1 / 3, 1 / 3, 1 / 6],
    ],
    "RK38": [
        [1 / 3, 1 / 3],
        [2 / 3, -1 / 3, 1],
        [1, 1, -1, 1],
        [1 / 8, 3 / 8, 3 / 8, 1 / 8],
    ],
}

def addDays(days):
    # returns the date + days
    date1 = datetime.datetime.strptime("01/01/20", "%m/%d/%y")
    return date1 + datetime.timedelta(days=days)


def toDate(steps):
    # return new date beginning on Jan 1st 2020 + t
    # unsure what 't' is
    return addDays(steps)

#this function doesn't have a 'seasonal_effect' parameter in modelOriginal.js
def fx(t, x, seasonal_effect):
    if (t > InterventionTime and t < InterventionTime + duration):
        beta = (InterventionAmt * R0) / D_infectious
    elif (t > InterventionTime + duration):
        beta = (0.5 * R0) / D_infectious
    else:
        beta = R0 / D_infectious

    month = toDate(t).month
    if (month == 4 or month == 9):
        beta = beta * math.pow(0.5, seasonal_effect)
    if (month > 4 and month < 9):
        beta = beta * math.pow(0.05, seasonal_effect)

    a = 1 / D_incbation
    gamma = 1 / D_infectious

    S = x[0] # Susectable
    E = x[1] # Exposed
    I = x[2] # Infectious
    Mild = x[3] # Recovering (Mild)
    Severe = x[4] # Recovering (Severe at home)
    Severe_H = x[5] # Recovering (Severe in hospital)
    Fatal = x[6] # Recovering (Fatal)
    R_Mild = x[7] # Recovered
    R_Severe = x[8] # Recovered
    R_Fatal = x[9] # Dead

    p_severe = P_SEVERE
    p_fatal = CFR
    p_mild = 1 - P_SEVERE - CFR

    dS = -beta * I * S
    dE = beta * I * S - a * E
    dI = a * E - gamma * I
    dMild = p_mild * gamma * I - (1 / D_recovery_mild) * Mild
    dSevere = p_severe * gamma * I - (1 / D_hospital_lag) * Severe
    dSevere_H =(1 / D_hospital_lag) * Severe - (1 / D_recovery_severe) * Severe_H
    dFatal = p_fatal * gamma * I - (1 / D_death) * Fatal
    dR_Mild = (1 / D_recovery_mild) * Mild
    dR_Severe = (1 / D_recovery_severe) * Severe_H
    dR_Fatal = (1 / D_death) * Fatal

    #      0   1   2   3      4        5          6       7        8          9
    return [
        dS,
        dE,
        dI,
        dMild,
        dSevere,
        dSevere_H,
        dFatal,
        dR_Mild,
        dR_Severe,
        dR_Fatal,
    ]

def integrate(m, fn, y, t, h, seasonal_effect):
    global dt
    k = []
    #argsInFunctionM = len(signature(m).parameters)
    for ki in range(0, len(m)):
        _y = list(y)
        dt = (m[ki-1][0] * h) if ki else 0 #dt = 0 the first loop, then it is m[ki-1][0]*h after that
        for l in range(0, len(_y)):
            for j in range(1, ki+1):
                _y[l] = _y[l] + h * m[ki - 1][j] * k[ki - 1][l]
        k.append(fn(t + dt, _y, dt))

    r = y.copy()
    for l in range(0, len(_y)):
        for j in range(0, len(k)):
            r[l] = r[l] + h * k[j][l] * m[ki - 1][j]
    return r

def f(seasonal_effect):
    global dt
    interpolation_steps = 40
    steps = 320 * interpolation_steps
    dt = dt / interpolation_steps
    sample_step = interpolation_steps

    method = Integrators["RK4"]

    v = [1 - I0 / N, 0, I0 / N, 0, 0, 0, 0, 0, 0, 0]
    t = 0

    P = []
    TI = []
    Iters = []
    while (steps > 0):
        if ((steps + 1) % sample_step == 0):
            P.append({
            "Time": toDate(t), #pretty sure this is wrong for python
            "Dead": N * v[9],
            "Susceptible": N * v[0],
            "Hospital": N * (v[5] + v[6]),
            "Recovered": N * (v[7] + v[8]),
            "Infected": N * v[2],
            "Exposed": N * v[1],
            "Sum": N * reduce((lambda a,b: a+b), v)
            })
        v = integrate(method, fx, v, t, dt, seasonal_effect)
        t += dt
        steps -= 1
    return P

data = f(1.0);

def getTrace(data, name):
    y = []
    x = []
    for i in range(0, len(data)):
        y.append(data[i]["Infected"])
        x.append(data[i]["Time"])
    
    trace = {
        "x": x,
        "y": y,
        "type": "scatter",
        "name": name,
    }
    return trace

#plotly.newPlot("myDiv", [getTrace(f(0.0), "Infected, seasonal effect = 0")])
plotData = getTrace(f(0.0), "Infected, seasonal effect = 0")
fig = px.scatter(x=plotData["x"], y=plotData["y"])
fig.show()