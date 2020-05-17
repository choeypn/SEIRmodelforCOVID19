# This is the code for the original model javascript code found at: https:#facultyweb.cs.wwu.edu/~jagodzf/covid-19/original/
import datetime
import math
import plotly.express as px
from functools import reduce

def f(seasonal_effect):
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
    # seasonal_effect          = 1

    interpolation_steps = 40
    steps = 320 * interpolation_steps
    dt = dt / interpolation_steps
    sample_step = interpolation_steps
  
    def addDays(days):
        # returns the date + days
        specificDate = datetime.datetime(2020, 1, 1)
        newDate = specificDate + datetime.timedelta(days=days)
        return newDate


    def toDate(steps):
        # return new date beginning on Jan 1st 2020 + t
        # unsure what 't' is
        return addDays(steps)


  # f is a func of time t and state y
  # y is the initial state, t is the time, h is the timestep
  # updated y is returned.
    def integrate(m, f, y, t, h):
        k = []
        for ki in range(0, len(m)):
            _y = y.copy()
            if (ki):
                dt = m[ki-1][0] * h
            else:
                dt = 0
            
            for l in range(0, len(_y)):
                for j in range(0, ki):
                    _y[l] = _y[l] + h * m[ki - 1][j] * k[ki - 1][l]
            #k[ki] = f(t + dt, _y, dt)
            k.append(f(t + dt, _y))
        
        r = y.copy()
        for l in range(0, len(_y)):
            for j in range(0, len(k)):
                r[l] = r[l] + h * k[j][l] * m[ki - 1][j]
        return r

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

    method = Integrators["RK4"]
    def f(t, x):
        # SEIR ODE
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
        dSevere_H = (1 / D_hospital_lag) * Severe - (1 / D_recovery_severe) * Severe_H
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

    v = [1 - I0 / N, 0, I0 / N, 0, 0, 0, 0, 0, 0, 0]
    t = 0

    P = []
    TI = []
    Iters = []
    while (steps):
        if ((steps + 1) % sample_step == 0):
            P.append({
            "Time": toDate(t),
            "Dead": N * v[9],
            "Susceptible": N * v[0],
            "Hospital": N * (v[5] + v[6]),
            "Recovered": N * (v[7] + v[8]),
            "Infected": N * v[2],
            "Exposed": N * v[1],
            "Sum": N * reduce((lambda a,b: a+b), v)
            })
        v = integrate(method, f, v, t, dt)
        t += dt
        steps -= 1

    return P

data = f(1.0)

def getTrace(data, name):
    y = []
    x = []
    for i in range (0, len(data)):
        y.append(data[i]["Infected"])
        x.append(data[i]["Time"])

    trace = {
    "x": x,
    'y': y,
    "type": "scatter",
    "name": name,
    }
    return trace

plotData = getTrace(f(0.0), "Infected, seasonal effect = 0")
fig = px.line(x=plotData["x"], y=plotData["y"])
fig.show()
