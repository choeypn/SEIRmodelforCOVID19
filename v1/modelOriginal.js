// This is the code for the original model javascript code found at: https://facultyweb.cs.wwu.edu/~jagodzf/covid-19/original/

function f(seasonal_effect) {
  var Time_to_death = 32;
  var logN = Math.log(7e6);
  var N = 327000000;
  var I0 = 1;
  var R0 = 2.2;
  var D_incbation = 5.2;
  var D_infectious = 2.9;
  var D_recovery_mild = 14 - 2.9;
  var D_recovery_severe = 31.5 - 2.9;
  var D_hospital_lag = 5;
  var D_death = Time_to_death - D_infectious;
  var CFR = 0.02;
  var InterventionTime = 10000;
  var InterventionAmt = 1 / 3;
  var Time = 220;
  var Xmax = 110000;
  var dt = 2;
  var P_SEVERE = 0.2;
  var duration = 7 * 12 * 1e10;
  // var seasonal_effect          = 1

  var interpolation_steps = 40;
  var steps = 320 * interpolation_steps;
  var dt = dt / interpolation_steps;
  var sample_step = interpolation_steps;
  Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
  };

  function toDate(steps) {
    var date = new Date("01/01/2020");
    return date.addDays(t);
  }

  // f is a func of time t and state y
  // y is the initial state, t is the time, h is the timestep
  // updated y is returned.
  var integrate = (m, f, y, t, h) => {
    for (var k = [], ki = 0; ki < m.length; ki++) {
      var _y = y.slice();
      if (ki) {
        dt = m[ki-1][0] * h;
      } else {
        dt = 0;
      }
      for (var l = 0; l < _y.length; l++)
        for (var j = 1; j <= ki; j++)
          _y[l] = _y[l] + h * m[ki - 1][j] * k[ki - 1][l]
      k[ki] = f(t + dt, _y, dt);
    }
    var r = y.slice();
    for (var l = 0; l < _y.length; l++) {
      for (var j = 0; j < k.length; j++) { 
        r[l] = r[l] + h * k[j][l] * m[ki - 1][j];
      }
    }
    return r;
  };

  var Integrators = {
    Euler: [[1]],
    Midpoint: [
      [0.5, 0.5],
      [0, 1],
    ],
    Heun: [
      [1, 1],
      [0.5, 0.5],
    ],
    Ralston: [
      [2 / 3, 2 / 3],
      [0.25, 0.75],
    ],
    K3: [
      [0.5, 0.5],
      [1, -1, 2],
      [1 / 6, 2 / 3, 1 / 6],
    ],
    SSP33: [
      [1, 1],
      [0.5, 0.25, 0.25],
      [1 / 6, 1 / 6, 2 / 3],
    ],
    SSP43: [
      [0.5, 0.5],
      [1, 0.5, 0.5],
      [0.5, 1 / 6, 1 / 6, 1 / 6],
      [1 / 6, 1 / 6, 1 / 6, 1 / 2],
    ],
    RK4: [
      [0.5, 0.5],
      [0.5, 0, 0.5],
      [1, 0, 0, 1],
      [1 / 6, 1 / 3, 1 / 3, 1 / 6],
    ],
    RK38: [
      [1 / 3, 1 / 3],
      [2 / 3, -1 / 3, 1],
      [1, 1, -1, 1],
      [1 / 8, 3 / 8, 3 / 8, 1 / 8],
    ],
  };

  var method = Integrators["RK4"];
  function f(t, x) {
    // SEIR ODE
    if (t > InterventionTime && t < InterventionTime + duration) {
      var beta = (InterventionAmt * R0) / D_infectious;
    } else if (t > InterventionTime + duration) {
      var beta = (0.5 * R0) / D_infectious;
    } else {
      var beta = R0 / D_infectious;
    }

    month = toDate(t).getMonth();
    if (month == 4 || month == 9) {
      beta = beta * Math.pow(0.5, seasonal_effect);
    }
    if (month > 4 && month < 9) {
      beta = beta * Math.pow(0.05, seasonal_effect);
    }

    var a = 1 / D_incbation;
    var gamma = 1 / D_infectious;

    var S = x[0]; // Susectable
    var E = x[1]; // Exposed
    var I = x[2]; // Infectious
    var Mild = x[3]; // Recovering (Mild)
    var Severe = x[4]; // Recovering (Severe at home)
    var Severe_H = x[5]; // Recovering (Severe in hospital)
    var Fatal = x[6]; // Recovering (Fatal)
    var R_Mild = x[7]; // Recovered
    var R_Severe = x[8]; // Recovered
    var R_Fatal = x[9]; // Dead

    var p_severe = P_SEVERE;
    var p_fatal = CFR;
    var p_mild = 1 - P_SEVERE - CFR;

    var dS = -beta * I * S;
    var dE = beta * I * S - a * E;
    var dI = a * E - gamma * I;
    var dMild = p_mild * gamma * I - (1 / D_recovery_mild) * Mild;
    var dSevere = p_severe * gamma * I - (1 / D_hospital_lag) * Severe;
    var dSevere_H =
      (1 / D_hospital_lag) * Severe - (1 / D_recovery_severe) * Severe_H;
    var dFatal = p_fatal * gamma * I - (1 / D_death) * Fatal;
    var dR_Mild = (1 / D_recovery_mild) * Mild;
    var dR_Severe = (1 / D_recovery_severe) * Severe_H;
    var dR_Fatal = (1 / D_death) * Fatal;

    //      0   1   2   3      4        5          6       7        8          9
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
    ];
  }

  var v = [1 - I0 / N, 0, I0 / N, 0, 0, 0, 0, 0, 0, 0];
  var t = 0;

  var P = [];
  var TI = [];
  var Iters = [];
  while (steps--) {
    if ((steps + 1) % sample_step == 0) {
      P.push({
        Time: toDate(t),
        Dead: N * v[9],
        Susceptible: N * v[0],
        Hospital: N * (v[5] + v[6]),
        Recovered: N * (v[7] + v[8]),
        Infected: N * v[2],
        Exposed: N * v[1],
        Sum: N * v.reduce((a, b) => a + b, 0),
      });
    }
    v = integrate(method, f, v, t, dt);
    t += dt;
  }
  return P;
}

data = f(1.0);

function getTrace(data, name) {
  y = [];
  x = [];
  for (var i = 0; i < data.length; i++) {
    y.push(data[i]["Infected"]);
    x.push(data[i]["Time"]);
  }

  var trace = {
    x: x,
    y: y,
    type: "scatter",
    name: name,
  };
  return trace;
}

function plot() {
  plotData = getTrace(f(0.0), "Infected, seasonal effect = 0");
  Plotly.newPlot("myDiv", [plotData]);
}

plot();

// for (var i = 0; i < data.length; i++) {
//   document.write(data[i]['Time'] + ", " + data[i]['Dead'] + ", " + data[i]['Hospital'] + ", " + data[i]["Recovered"] + ", " + data[i]["Infected"] + ", " + data[i]["Exposed"] + ", " + data[i]["Sum"] + "<br>")
// }
