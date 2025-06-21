const atomicWeights = {
    H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007, O: 15.999,
    F: 18.998, Ne: 20.18, Na: 22.99, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45,
    Ar: 39.948, K: 39.098, Ca: 40.078, Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996,
    Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38, Ga: 69.723,
    Ge: 72.63, As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468, Sr: 87.62,
    Y: 88.906, Zr: 91.224, Nb: 92.906, Mo: 95.95, Tc: 98, Ru: 101.07, Rh: 102.91,
    Pd: 106.42, Ag: 107.87, Cd: 112.41, In: 114.82, Sn: 118.71, Sb: 121.76, Te: 127.6,
    I: 126.9, Xe: 131.29, Cs: 132.91, Ba: 137.33, La: 138.91, Ce: 140.12, Pr: 140.91,
    Nd: 144.24, Pm: 145, Sm: 150.36, Eu: 151.96, Gd: 157.25, Tb: 158.93, Dy: 162.5,
    Ho: 164.93, Er: 167.26, Tm: 168.93, Yb: 173.05, Lu: 174.97, Hf: 178.49, Ta: 180.95,
    W: 183.84, Re: 186.21, Os: 190.23, Ir: 192.22, Pt: 195.08, Au: 196.97, Hg: 200.59,
    Tl: 204.38, Pb: 207.2, Bi: 208.98, Po: 209, At: 210, Rn: 222, Fr: 223,
    Ra: 226, Ac: 227, Th: 232.04, Pa: 231.04, U: 238.03, Np: 237, Pu: 244,
    Am: 243, Cm: 247, Bk: 247, Cf: 251, Es: 252, Fm: 257, Md: 258, No: 259,
    Lr: 262, Rf: 267, Db: 270, Sg: 271, Bh: 270, Hs: 277, Mt: 276, Ds: 281,
    Rg: 280, Cn: 285, Nh: 284, Fl: 289, Mc: 288, Lv: 293, Ts: 294, Og: 294
  };
  
  function parseFormula(formula) {
    const elements = {};
    const regex = /([A-Z][a-z]*)(\d*)/g;
    let match;
    while ((match = regex.exec(formula)) !== null) {
      const element = match[1];
      const count = parseInt(match[2] || '1');
      elements[element] = (elements[element] || 0) + count;
    }
    return elements;
  }
  
  function addRow(formula = '', mol = '') {
    const table = document.getElementById("inputTable").getElementsByTagName('tbody')[0];
    const row = table.insertRow();
    const cell1 = row.insertCell(0);
    const cell2 = row.insertCell(1);
    cell1.innerHTML = `<input type="text" value="${formula}">`;
    cell2.innerHTML = `<input type="number" value="${mol}">`;
  }
  
  function handlePasteInput() {
    const text = document.getElementById("pasteArea").value.trim();
    const lines = text.split(/\r?\n/);
    const tbody = document.getElementById("inputTable").getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
  
    lines.forEach(line => {
      const parts = line.split(/\t|\s+/);
      if (parts.length >= 2) {
        addRow(parts[0], parts[2] || parts[1]);
      }
    });
  }
  
  function generateExcludeElementList(allElements) {
    const container = document.getElementById("excludeElementList");
    container.innerHTML = '';
    allElements.sort().forEach(element => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = element;
      checkbox.checked = false;
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(' ' + element + ' '));
      container.appendChild(label);
    });
  }
  
  function calculateElementRatios() {
    const table = document.getElementById("inputTable");
    const rows = table.getElementsByTagName('tbody')[0].rows;
    const elementMolTotals = {};
    const elementMassTotals = {};
    const allElementsSet = new Set();
  
    for (let i = 0; i < rows.length; i++) {
      const formula = rows[i].cells[0].querySelector('input').value;
      const molPercent = parseFloat(rows[i].cells[1].querySelector('input').value);
      if (!formula || isNaN(molPercent)) continue;
  
      const parsed = parseFormula(formula);
      Object.keys(parsed).forEach(el => allElementsSet.add(el));
    }
  
    if (!document.getElementById("excludeElementList").hasChildNodes()) {
      generateExcludeElementList([...allElementsSet]);
    }
  
    const exclude = Array.from(document.querySelectorAll('#excludeElementList input:checked')).map(e => e.value);
  
    for (let i = 0; i < rows.length; i++) {
      const formula = rows[i].cells[0].querySelector('input').value;
      const molPercent = parseFloat(rows[i].cells[1].querySelector('input').value);
      if (!formula || isNaN(molPercent)) continue;
  
      const parsed = parseFormula(formula);
      const totalAtoms = Object.values(parsed).reduce((a, b) => a + b, 0);
  
      for (const [element, count] of Object.entries(parsed)) {
        if (exclude.includes(element)) continue;
        const atomMol = molPercent * (count / totalAtoms);
        const mass = atomMol * (atomicWeights[element] || 0);
  
        elementMolTotals[element] = (elementMolTotals[element] || 0) + atomMol;
        elementMassTotals[element] = (elementMassTotals[element] || 0) + mass;
      }
    }
  
    const molSum = Object.values(elementMolTotals).reduce((a, b) => a + b, 0);
    const massSum = Object.values(elementMassTotals).reduce((a, b) => a + b, 0);
  
    const tbody = document.getElementById("outputTable").getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';
  
    for (const element of Object.keys(elementMolTotals)) {
      const tr = document.createElement("tr");
      const td1 = document.createElement("td");
      const td2 = document.createElement("td");
      const td3 = document.createElement("td");
      td1.textContent = element;
      td2.textContent = (elementMassTotals[element] / massSum * 100).toFixed(2);
      td3.textContent = (elementMolTotals[element] / molSum * 100).toFixed(2);
      tr.appendChild(td1);
      tr.appendChild(td2);
      tr.appendChild(td3);
      tbody.appendChild(tr);
    }
  }
  