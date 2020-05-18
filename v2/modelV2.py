# This is the code for the original model javascript code found at: https:#facultyweb.cs.wwu.edu/~jagodzf/covid-19/original/
import datetime
import math
import plotly.express as px
import sys
from functools import reduce

def strType(xstr):
        try:
            int(xstr)
            return 'int'
        except:
            try:
                float(xstr)
                return 'float'
            except:
                try:
                    complex(xstr)
                    return 'complex'
                except:
                    return 'str'

def f(seasonal_effect):
    #default values for the model
    Time_to_death = 25
    logN = math.log(7e6)
    #N = 7800000
    #I0 = 1
    #R0 = 2.5
    D_incubation = 5.0
    D_infectious = 3.0
    D_recovery_mild = 11.0
    D_recovery_severe = 21.0
    DHospitalLag = 8
    D_death = Time_to_death - D_infectious
    #CFR = 0.01
    InterventionTime = 10000
    InterventionAmt = 1 / 3
    Time = 220
    Xmax = 110000
    dt = 1
    #P_SEVERE = 0.04
    duration = 7 * 12 * 1e10
    seasonal_effect = 0

    interpolation_steps = 40
    steps = 320 * interpolation_steps
    dt = dt / interpolation_steps
    sample_step = interpolation_steps

    # default values for variables go here
    switcher = {
        "N": 7800000,
        "I0": 1,
        "R0": 2.5,
        "CFR": 0.01,
        "PSEVERE": 0.04
    }
    #begin changing variable values to the command line argument values if supplied
    print(sys.argv)
    for i in range(1, len(sys.argv)):
        #require arg to have 2 leading dashes in front
        if (sys.argv[i][0:2] == "--"):
            argument = sys.argv[i][2:].upper()
            if (strType(argument) != "str"):
                print("Argument should be a string")
                continue
            
            #make sure there's more command line arguments
            if (i+1 >= len(sys.argv)):
                print("Need more command line arguments")
                continue
            
            argumentValue = sys.argv[i+1]
            argumentValueType = strType(argumentValue)
            if (argumentValueType != "float" and argumentValueType != "int"):
                print(argumentValue + ": needs to be a numeric value. ", end="")
                print("Type received: " + argumentValueType)
                continue
            
            if (argumentValueType == "float"):
                switcher[argument] = float(argumentValue)
            else:
                switcher[argument] = int(argumentValue)
            #i+=1

        elif (strType(sys.argv[i]) == "str"):
            print(sys.argv[i] + ". is not a valid argument")
    
    N = switcher["N"]
    I0 = switcher["I0"]
    R0 = switcher["R0"]
    CFR = switcher["CFR"]
    P_SEVERE = switcher["PSEVERE"]

    for key in switcher.keys():
        print(key + ": " + str(switcher[key]))
    print(switcher)
  
    def addDays(days):
        # returns the date + days
        specificDate = datetime.datetime(2020, 1, 15)
        newDate = specificDate + datetime.timedelta(days=days)
        return newDate


    def toDate(steps):
        # return new date beginning on Jan 1st 2020 + t
        # unsure what 't' is
        return addDays(steps)


  # f is a func of time t and state y
  # y is the initial state, t is the time, h is the timestep
  # updated y is returned.
    def integrate(m, fn, y, t, h):
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
            k.append(fn(t + dt, _y))
        
        r = y.copy()
        for l in range(0, len(_y)):
            for j in range(0, len(k)):
                r[l] = r[l] + h * k[j][l] * m[ki][j]
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
        day = toDate(t).day
        if (month == 4 or month == 9):
            beta = beta * math.pow(0.5, seasonal_effect)
        if (month > 4 and month < 9):
            beta = beta * math.pow(0.05, seasonal_effect)

        a = 1 / D_incubation
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
        dSevere = p_severe * gamma * I - (1 / DHospitalLag) * Severe
        dSevere_H = (1 / DHospitalLag) * Severe - (1 / D_recovery_severe) * Severe_H
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
            "R0": R0,
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

data = f(0.0)

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

plotData = getTrace(data, "Infected, seasonal effect = 0")
fig = px.line(x=plotData["x"], y=plotData["y"])
fig.show()
