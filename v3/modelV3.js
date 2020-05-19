function checkR0textBox() {
  var lines = document.getElementById("R0TextArea").value.split("\n");
  if (i == 0 && lines[i].split(" ")[0] != "0") {
    alert("Error in R0 : first R0 is not 0");
  }
  for (var i = 0; i < lines.length; i++) {
    if (parseInt(lines[i].split(" ").length) != 2) {
      alert("Error in R0 : entry " + lines[i] + " does not have 2 items");
    } else if (isNaN(lines[i].split(" ")[0]) || isNaN(lines[i].split(" ")[1])) {
      alert("Error in R0 : entry " + lines[i] + " has a non number value");
    }
  }
}
// used for decaying R0 values
function GetR0Vals() {
  // temp array
  var arrayR0 = [];
  for (var i = 1; i <= 365; i++) {
    arrayR0.push(0.0);
  }

  var R0InputVal = localStorage.getItem("R0InputLS");
  if (R0InputVal !== null) {
    document.getElementById("R0TextArea").value = R0InputVal;
  }

  // validate inputs
  checkR0textBox();

  // get values from textbox
  var textArea = document.getElementById("R0TextArea").value;
  var lines = document.getElementById("R0TextArea").value.split("\n");
  for (var i = 0; i < lines.length - 1; i++) {
    // get successive pairs of rows
    var line1 = lines[i];
    var line2 = lines[i + 1];

    // calculate delta y, delta x
    var line1_x = parseInt(line1.split(" ")[0]);
    var line1_y = parseFloat(line1.split(" ")[1]);
    var line2_x = parseInt(line2.split(" ")[0]);
    var line2_y = parseFloat(line2.split(" ")[1]);
    var deltaX = parseFloat(line2_x - line1_x);
    var deltaY = parseFloat(line2_y - line1_y);

    // calculate slope
    var slope = parseFloat(deltaY / deltaX);

    // get y intercept, b
    var b = line1_y - slope * line1_x;

    // set value of boundary conditions (repeat calc, but O(linear))
    arrayR0[line1_x] = line1_y;
    arrayR0[line2_x] = line2_y;

    // for all intermediate points between x2 and x1, calculate slope
    // y = mx + b
    for (var j = line1_x + 1; j < line2_x; j++) {
      arrayR0[j] = parseFloat(slope * j + b);
    }
  }

  return arrayR0;
}

function saveVars() {
  var NInput = document.getElementById("Input_N").value;
  if (NInput != null) {
    localStorage.setItem("NInputLS", NInput);
  }

  var R0Input = document.getElementById("R0TextArea").value;
  if (R0Input != null) {
    localStorage.setItem("R0InputLS", R0Input);
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

  var DHospitalLagInput = document.getElementById("Input_DHospitalLag").value;
  if (DHospitalLagInput != null) {
    localStorage.setItem("DHospitalLagInputLS", DHospitalLagInput);
  }

  var StartDateInput = "";
  var elements = document.getElementsByName("Input_StartDate");
  for (i = 0; i < elements.length; i++) {
    if (elements[i].checked) {
      StartDateInput = elements[i].value;
    }
  }
  if (StartDateInput == "") {
    StartDateInput = "01/15/2020";
  }

  localStorage.setItem("StartDateInputLS", StartDateInput);

  window.location.reload();
}

function loadUserVals() {
  var R0InputVal = localStorage.getItem("R0InputLS");

  var I0Val = localStorage.getItem("I0InputLS");
  var NVal = localStorage.getItem("NInputLS");
  var CFRVal = localStorage.getItem("CFRInputLS");
  var PSEVEREVal = localStorage.getItem("PSEVEREInputLS");
  var StartDateVal = localStorage.getItem("StartDateInputLS");
  var DHospitalLagVal = localStorage.getItem("DHospitalLagInputLS");

  StartDatenew = "01/15/2020";
  if (StartDateVal !== null) {
    StartDatenew = StartDateVal;
  }

  var elements = document.getElementsByName("Input_StartDate");
  for (i = 0; i < elements.length; i++) {
    if (elements[i].value == StartDatenew) {
      elements[i].checked = true;
    }
  }

  R0Inputnew = "";
  if (R0InputVal !== null) {
    R0Inputnew = R0InputVal;
  }
  document.getElementById("R0TextArea").value = R0Inputnew;

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

  DHospitalLagnew = 8;
  if (DHospitalLagVal !== null) {
    DHospitalLagnew = parseFloat(DHospitalLagVal);
  }
  document.getElementById("Input_DHospitalLag").value = DHospitalLagnew;
}

function f(seasonal_effect) {
  var R0 = 2.85;

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
  var DHospitalLagVal = localStorage.getItem("DHospitalLag");
  if (DHospitalLagVal !== null) {
    DHospitalLag = parseFloat(DHospitalLagVal);
  }

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

  var DHospitalLag = 8;
  var DHospitalLagVal = localStorage.getItem("DHospitalLagInputLS");
  if (DHospitalLagVal !== null) {
    DHospitalLag = parseFloat(DHospitalLagVal);
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
    var startDateVal = localStorage.getItem("StartDateInputLS");
    var StartDateInput2 = "01/15/2020";
    var elements = document.getElementsByName("Input_StartDate");
    for (i = 0; i < elements.length; i++) {
      if (elements[i].checked) {
        StartDateInput2 = elements[i].value;
      }
    }
    var date = new Date(startDateVal);
    document.getElementById("start").innerHTML = date;

    return date.addDays(t);
  }

  // f is a func of time t and state y
  // y is the initial state, t is the time, h is the timestep
  // updated y is returned.
  var integrate = (m, f, y, t, h) => {
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

    var startDateVal = localStorage.getItem("StartDateInputLS");
    var startDATE = new Date(startDateVal);
    var Difference_In_Time = toDate(t) - startDATE;
    var Difference_In_Days = Math.round(
      Difference_In_Time / (1000 * 3600 * 24)
    );

    R0 = arrayOfR0s[Difference_In_Days];
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
        HospitalLag: DHospitalLag,
        Dead: N * v[9],
        Susceptible: N * v[0],
        Hospital: N * (v[5] + v[6]),
        RecoveredMild: N * v[7],
        RecoveredSevere: N * v[8],
        RecoveredTotal: N * (v[7] + v[8]),
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

// inspect JSON object
// alert(JSON.stringify(data[24],null,4));
function getTrace(data, name, metric) {
  y = [];
  x = [];
  for (var i = 0; i < data.length; i++) {
    y.push(data[i][metric]);
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

// make array of length 365 (yas, hard coded)
var arrayOfR0s = GetR0Vals();

data = f(0.0);
Plotly.newPlot("plotInfections", [
  getTrace(data, "Infected, seasonal effect = 0", "Infected"),
]);
Plotly.newPlot("plotDead", [getTrace(data, "Deaths", "Dead")]);
Plotly.newPlot("plotRecoveredTotal", [
  getTrace(data, "Recovered Total", "RecoveredTotal"),
]);

document.getElementById("rawData").innerHTML +=
  "Time, " +
  "R0, " +
  "Deceased, " +
  "HospitalLag, " +
  "Hospital, " +
  "RecoveredMild, " +
  "RecoveredSevere, " +
  "RecoveredTotal, " +
  "Infected, " +
  "Exposed, " +
  "Sum" +
  "<br>";
for (var i = 0; i < data.length; i++) {
  var newDate = String(data[i]["Time"]).split(" ");
  var numDec = 3;
  document.getElementById("rawData").innerHTML +=
    newDate[2] +
    " " +
    newDate[1] +
    " " +
    newDate[3] +
    ", " +
    data[i]["R0"] +
    ", " +
    data[i]["Dead"].toFixed(numDec) +
    ", " +
    data[i]["HospitalLag"].toFixed(numDec) +
    ", " +
    data[i]["Hospital"].toFixed(numDec) +
    ", " +
    data[i]["RecoveredMild"].toFixed(numDec) +
    ", " +
    data[i]["RecoveredSevere"].toFixed(numDec) +
    ", " +
    data[i]["RecoveredTotal"].toFixed(numDec) +
    ", " +
    data[i]["Infected"].toFixed(numDec) +
    ", " +
    data[i]["Exposed"].toFixed(numDec) +
    ", " +
    data[i]["Sum"].toFixed(numDec) +
    "<br>";
}
