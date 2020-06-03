# This is the code for the original model javascript code found at: https:#facultyweb.cs.wwu.edu/~jagodzf/covid-19/original/
import argparse
import datetime
import math
import sys
from functools import reduce
#RT is the same as R0 (R naught)
#RT is the rate of transmission
#If R0 is 2, then that person will give it to two other people
#R0 ranges between 0.5 and 4        
# If R0 < 1.2 there's not enough transmission that it doesn't spread

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
                    
def toDate(startDate, days):
        # return new date beginning on Jan 1st 2020 + t
        # unsure what 't' is
        return startDate + datetime.timedelta(days=days)

def ReadDecayLine(line):
    lineValues = line.split(" ")
    if (len(lineValues) != 2):
        print(line + ": does not contain exactly 2 values.")
        return None
    
    dayValues = lineValues[0].split("=")
    if (len(dayValues) != 2 or dayValues[0] != "day" or not dayValues[1].isdigit()):
        print(lineValues[0] + ": should be formatted as day={int}")
        return None
    
    metricValues = lineValues[1].split("=")
    if (len(metricValues) != 2 or metricValues[0] != "R0" or strType(metricValues[1]) != "float"):
        print(lineValues[1] + ": should be formatted as R0={float}")
        return None

    #return (day, metric, metricValue)
    return (int(dayValues[1]), "R0", float(metricValues[1]))

def GetR0DecayValues(R0FilePath):
    arrayR0 = []
    XAxis = 0
    YAxis = 2
    
    R0File = open(R0FilePath, "r")
    line1 = R0File.readline().strip()
    line1Values = ReadDecayLine(line1)
    if (line1Values == None):
        return None
    
    if (line1Values[XAxis] != 0):
        print("The first line within the given decay file must have day=0")
        return None

    for line2 in R0File:
        line2 = line2.strip()
        # skip empty lines
        if (line2 == ""):
            continue

        line2Values = ReadDecayLine(line2)
        if (line2Values == None):
            return None
        
        if (line2Values[XAxis] < line1Values[XAxis]):
            print("Cannot go down in days in the given decay file.")
            return None
        
        deltaX = float(line2Values[XAxis] - line1Values[XAxis]) #day values
        deltaY = float(line2Values[YAxis] - line1Values[YAxis]) #R0 Values
        slope = float(deltaY / deltaX)
        b = float(line1Values[YAxis] - slope * line1Values[XAxis])

        arrayR0.append(line1Values[YAxis])
        for j in range(line1Values[XAxis]+1, line2Values[XAxis]):
            arrayR0.append(float(slope * j + b))
        
        line1Values = line2Values
    
    if (line2Values[XAxis] < 365):
        print("The last line within the given decay file must have a day that is greater than or equal to 365.")
        return None

    #currently is not guaranteed to place values in all 365 indexes of the array
    return arrayR0

def BetterCommandLineArgReader():
    parser = argparse.ArgumentParser(description='SEIR Model For Covid 19')
    parser.add_argument("-g", action="store_true", dest="graph")  
    parser.add_argument("-population", action="store", type=int, dest="N",
                        help="The population size for the model")
    parser.add_argument("-r0", action="store", type=float, dest="R0",
                        help="The rate of transmission to be used for the ENTIRE population")
    parser.add_argument("-i0", action="store", type=int, dest="I0")
    parser.add_argument("-cfr", action="store", type=float, dest="CFR")
    parser.add_argument("-psevere", action="store", type=float, dest="PSEVERE",
                        help="The probability that the infection is severe")
    parser.add_argument("-hl", "--hospital_lag", action="store", type=float, dest="HOSPITALLAG",
                        help="The hospital lag")
    parser.add_argument("-decay", action="store", 
                        help="Indicate path to .txt file containing age groups and R0 values")
    parser.add_argument("-inc", action="store", type=float, dest="DINC",
                        help="Incubation period")
    parser.add_argument("-inf", action="store", type=float, dest="DINF",
                        help="Infectious period")
    parser.add_argument("-recm", action="store", type=float, dest="RECM",
                        help="Mild recovery period")
    parser.add_argument("-recs", action="store", type=float, dest="RECS",
                        help="Severe recovery period")
    parser.add_argument("-ttd", action="store", type=int, dest="TimeTD",
                        help="Time to death")
    return parser.parse_args()

def UpdateDefaultValues(defaultValues, arguments):
    argumentsDict = vars(arguments)
    for arg in argumentsDict:
        if argumentsDict[arg] is not None:
            defaultValues[arg] = argumentsDict[arg]

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

def f(defaultValues):
    #default values for the model
    #Time_to_death = 25
    #logN = math.log(7e6) not used
    #N = 7800000
    #I0 = 1
    #R0 = 2.5
    #D_incubation = 5.0
    #D_infectious = 3.0
    #D_recovery_mild = 11.0
    #D_recovery_severe = 21.0
    #DHospitalLag = 8
    
    #CFR = 0.01
    InterventionTime = 10000
    InterventionAmt = 1 / 3
    #Time = 220 not used
    #Xmax = 110000 not used
    dt = 1
    #P_SEVERE = 0.04
    duration = 7 * 12 * 1e10
    #seasonal_effect = 0 #not used

    interpolation_steps = 40
    steps = 320 * interpolation_steps
    dt = dt / interpolation_steps
    sample_step = interpolation_steps

    N = defaultValues["N"]
    I0 = defaultValues["I0"]
    R0 = defaultValues["R0"]
    CFR = defaultValues["CFR"]
    P_SEVERE = defaultValues["PSEVERE"]
    DHospitalLag = defaultValues["HOSPITALLAG"]
    UseDecayingR0 = defaultValues["UseDecayingR0"]
    R0FilePath = defaultValues["R0FilePath"]
    D_incubation = defaultValues["DINC"]
    D_infectious = defaultValues["DINF"]
    D_recovery_mild = defaultValues["RECM"]
    D_recovery_severe = defaultValues["RECS"]
    Time_to_death = defaultValues["TimeTD"]
    D_death = Time_to_death - D_infectious
    
    if (UseDecayingR0):
        arrayOfR0s = GetR0DecayValues(R0FilePath)
        if (arrayOfR0s == None):
            exit()
  
    StartDate = datetime.datetime(2020, 1, 15)
    method = Integrators["RK4"]
    def f(t, x):
        nonlocal R0
        nonlocal UseDecayingR0
        nonlocal arrayOfR0s
        if (UseDecayingR0):
            CurrentDate = toDate(StartDate, t)
            DifferenceInDays = CurrentDate - StartDate
            R0 = arrayOfR0s[DifferenceInDays.days]

        # SEIR ODE
        if (t > InterventionTime and t < InterventionTime + duration):
            beta = (InterventionAmt * R0) / D_infectious
        elif (t > InterventionTime + duration):
            beta = (0.5 * R0) / D_infectious
        else:
            beta = R0 / D_infectious

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
    while (steps):
        if ((steps + 1) % sample_step == 0):
            P.append({
            "Time": toDate(StartDate, t),
            "R0": R0,
            "HospitalLag": DHospitalLag,
            "Dead": N * v[9],
            "Susceptible": N * v[0],
            "Hospital": N * (v[5] + v[6]),
            "RecoveredMild": N * v[7],
            "RecoveredSevere": N * v[8],
            "RecoveredTotal": N * (v[7] + v[8]),
            "Infected": N * v[2],
            "Exposed": N * v[1],
            "Sum": N * reduce((lambda a,b: a+b), v)
            })
        v = integrate(method, f, v, t, dt)
        t += dt
        steps -= 1

    return P

def getTrace(data, name, metric):
    y = []
    x = []
    for i in range (0, len(data)):
        y.append(data[i][metric])
        x.append(data[i]["Time"])

    trace = {
    "x": x,
    'y': y,
    "type": "scatter",
    "name": name,
    }
    return trace

def printInputTable(data,inputname,modvar, modvar2):
        inf = "Infected"
        exp = "Exposed"
        hos = "Hospital"
        maxval  = [0.0, 0.0, 0.0, 0.0, 0.0]     #in order: max inf, max exp, max hos, total dead, total recovered 
        maxdate = ["", "", "", ""]              #date for max val, last entry is for last day of data
        for i in range (0,len(data)):
                if (maxval[0] <= data[i][inf]):
                        maxval[0] =  data[i][inf]
                        maxdate[0] =  data[i]["Time"].strftime("%b-%d-%y")
                if (maxval[1] <= data[i][exp]):
                        maxval[1] =  data[i][exp]
                        maxdate[1] =  data[i]["Time"].strftime("%b-%d-%y")
                if (maxval[2] <= data[i][hos]):
                        maxval[2] =  data[i][hos]
                        maxdate[2] =  data[i]["Time"].strftime("%b-%d-%y")
                

        maxval[3] = data[i-1]["Dead"]
        maxval[4] = data[i-1]["RecoveredTotal"]
        maxdate[3] = data[i-1]["Time"].strftime("%b-%d-%y")
        
        print(modvar,modvar2,maxval[0],maxdate[0],maxval[1],maxdate[1],maxval[2],maxdate[2],maxval[3],maxval[4],maxdate[3])
        pass

def getmodifiedVariableName(arguments):
    argumentsDict = vars(arguments)
    names = []
    for arg in argumentsDict:
        if argumentsDict[arg] is not None:
            names.append(argumentsDict[arg])

    return names
def main():
        # default values for variables that can be modified with command line arguments go here
    defaultValues = {
        "N": 226387,
        "I0": 1,
        "R0": 2.85,
        "CFR": 0.01,
        "PSEVERE": 0.04,
        "HOSPITALLAG": 8,
        "DINC": 5.0,
        "DINF" : 3.0,
        "RECM" : 11.0,
        "RECS": 21.0,
        "TimeTD" : 25, 
        "UseDecayingR0": False,
        "R0FilePath": None
    }
    args = BetterCommandLineArgReader()
    UpdateDefaultValues(defaultValues, args)


    #Will be true if the -decay flag is present with a file path
    defaultValues["UseDecayingR0"] = args.decay is not None
    if (defaultValues["UseDecayingR0"]):
        defaultValues["R0FilePath"] = args.decay
    
    data = f(defaultValues)

    modifiedvariable = getmodifiedVariableName(args)

    if(len(modifiedvariable) > 1):
            printInputTable(data,"Infected",modifiedvariable[1],modifiedvariable[2])
    else:
            printInputTable(data,"Infected","","")


if __name__ == "__main__":
    main()
