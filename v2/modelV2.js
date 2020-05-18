//saves variables
function saveVars() {
  var R0Input = document.getElementById("Input_R0").value;
  if (R0Input != null) {
    localStorage.setItem("R0InputLS", R0Input);
  }

  var NInput = document.getElementById("Input_N").value;
  if (NInput != null) {
    localStorage.setItem("NInputLS", NInput);
  }

  var I0Input = document.getElementById("Input_I0").value;
  if (I0Input != null) {
    localStorage.setItem("I0InputLS", I0Input);
  }

  var CFRInput = document.getElementById("Input_CFR").value;
  if (CFRInput != null) {
    localStorage.setItem("CFRInputLS", CFRInput);
  }

  var PSEVEREInput = document.getElementById("Input_PSEVERE").value;
  if (PSEVEREInput != null) {
    localStorage.setItem("PSEVEREInputLS", PSEVEREInput);
  }

  window.location.reload();
}

//loads variables
function loadUserVals() {
  var R0Val = localStorage.getItem("R0InputLS");
  var I0Val = localStorage.getItem("I0InputLS");
  var NVal = localStorage.getItem("NInputLS");
  var CFRVal = localStorage.getItem("CFRInputLS");
  var PSEVEREVal = localStorage.getItem("PSEVEREInputLS");

  R0new = 2.5;
  if (R0Val !== null) {
    R0new = parseFloat(R0Val);
  }
  document.getElementById("Input_R0").value = R0new;

  I0new = 1.0;
  if (I0Val !== null) {
    I0new = parseFloat(I0Val);
  }
  document.getElementById("Input_I0").value = I0new;

  Nnew = 7800000;
  if (NVal !== null) {
    Nnew = parseFloat(NVal);
  }
  document.getElementById("Input_N").value = Nnew;

  CFRnew = 0.01;
  if (CFRVal !== null) {
    CFRnew = parseFloat(CFRVal);
  }
  document.getElementById("Input_CFR").value = CFRnew;

  PSEVEREnew = 0.04;
  if (PSEVEREVal !== null) {
    PSEVEREnew = parseFloat(PSEVEREVal);
  }
  document.getElementById("Input_PSEVERE").value = PSEVEREnew;
}

//the two functions above probably aren't needed for command line arguments
function f(seasonal_effect) {
  var R0 = 2.5;
  var R0Val = localStorage.getItem("R0InputLS");
  if (R0Val !== null) {
    R0 = parseFloat(R0Val);
  }

  var I0 = 1.0;
  var I0Val = localStorage.getItem("I0InputLS");
  if (I0Val !== null) {
    I0 = parseFloat(I0Val);
  }

  var Time_to_death = 25;
  document.getElementById("varTimeToDeath").innerHTML = Time_to_death;

  var logN = Math.log(7e6);

  var N = 7800000;
  var NVal = localStorage.getItem("NInputLS");
  if (NVal !== null) {
    N = parseFloat(NVal);
  }

  var D_incubation = 5.0;
  document.getElementById("varDincubation").innerHTML = D_incubation;

  var D_infectious = 3.0;
  document.getElementById("varDinfectious").innerHTML = D_infectious;

  var D_recovery_mild = 11.0;
  document.getElementById("varDrecoverymild").innerHTML = D_recovery_mild;

  var D_recovery_severe = 21;
  document.getElementById("varDrecoverysevere").innerHTML = D_recovery_severe;

  var DHospitalLag = 8;
  document.getElementById("varDhospitallag").innerHTML = DHospitalLag;

  var D_death = Time_to_death - D_infectious;
  document.getElementById("varDdeath").innerHTML = D_death;

  var CFR = 0.01;
  var CFRVal = localStorage.getItem("CFRInputLS");
  if (CFRVal !== null) {
    CFR = parseFloat(CFRVal);
  }

  var InterventionTime = 10000;
  document.getElementById("varInterventionTime").innerHTML = InterventionTime;

  var InterventionAmt = 1 / 3;
  document.getElementById("varInterventionAmt").innerHTML = InterventionAmt;

  var Time = 220;
  document.getElementById("varTime").innerHTML = Time;

  var Xmax = 110000;
  document.getElementById("varXmax").innerHTML = Xmax;

  var dt = 1;
  document.getElementById("vardt").innerHTML = dt;

  var P_SEVERE = 0.04;
  var PSEVEREVal = localStorage.getItem("PSEVEREInputLS");
  if (PSEVEREVal !== null) {
    P_SEVERE = parseFloat(PSEVEREVal);
  }

  var duration = 7 * 12 * 1e10;
  document.getElementById("varduration").innerHTML = duration;

  var seasonal_effect = 0;
  document.getElementById("varseasonaleffect").innerHTML = seasonal_effect;

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
    var date = new Date("01/15/2020");
    document.getElementById("start").innerHTML = date;
    return date.addDays(t);
  }

  // f is a func of time t and state y
  // y is the initial state, t is the time, h is the timestep
  // updated y is returned.
  // f is a func of time t and state y
  // y is the initial state, t is the time, h is the timestep
  // updated y is returned.
  var integrate = (m, f, y, t, h) => {
    //alert("t is " + t);
    for (var k = [], ki = 0; ki < m.length; ki++) {
      var _y = y.slice(),
        dt = ki ? m[ki - 1][0] * h : 0;
      for (var l = 0; l < _y.length; l++)
        for (var j = 1; j <= ki; j++)
          _y[l] = _y[l] + h * m[ki - 1][j] * k[ki - 1][l];
      k[ki] = f(t + dt, _y, dt);
    }
    for (var r = y.slice(), l = 0; l < _y.length; l++)
      for (var j = 0; j < k.length; j++)
        r[l] = r[l] + h * k[j][l] * m[ki - 1][j];
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
    var month = toDate(t).getMonth();
    var day = toDate(t).getDate();
    //									  if (month == 0 || month == 1){
    //									  R0 = 2.85;
    //									  } else if (month == 2 && day < 12){
    //									 R0 = 2.85;
    //									 } else if (month == 2 && day < 15){
    //									R0 = 2.5;
    //									  } else if (month == 2 && day < 25){
    //									  R0 = 1.8;
    //									  } else if (month == 2 || month == 3){
    //									  R0 = 0.95;
    //									  } else if (month == 4 && day < 6){
    //									  R0 = 0.95;
    //									  } else {
    //									  R0 = 1.2
    //									  };
    //
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

    var a = 1 / D_incubation;
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
    var dSevere = p_severe * gamma * I - (1 / DHospitalLag) * Severe;
    var dSevere_H =
      (1 / DHospitalLag) * Severe - (1 / D_recovery_severe) * Severe_H;
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
        R0: R0,
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
data = f(0.0);

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

Plotly.newPlot("plot", [getTrace(f(0.0), "Infected, seasonal effect = 0")]);

// this writes to <div id="rawData">
// pretty sure it's uneccessary for python unless we want to write to a text file or something
document.getElementById("rawData").innerHTML +=
  "Time, " +
  "R0, " +
  "Deceased, " +
  "Hospital, " +
  "Recovered, " +
  "Infected, " +
  "Exposed, " +
  "Sum" +
  "<br>";
for (var i = 0; i < data.length; i++) {
  document.getElementById("rawData").innerHTML +=
    data[i]["Time"] +
    ", " +
    data[i]["R0"] +
    ", " +
    data[i]["Dead"] +
    ", " +
    data[i]["Hospital"] +
    ", " +
    data[i]["Recovered"] +
    ", " +
    data[i]["Infected"] +
    ", " +
    data[i]["Exposed"] +
    ", " +
    data[i]["Sum"] +
    "<br>";
}
