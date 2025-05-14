let chart;
let selectedFiles = [];

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const downloadBtn = document.getElementById("downloadBtn");
  const dropZone = document.getElementById("dropZone");
  const offsetInput = document.getElementById("offsetInput");

  //ファイル選択
  fileInput.addEventListener("change", (e) => {
    selectedFiles = selectedFiles.concat([...e.target.files]);
    const list = document.getElementById("fileList");
    list.innerHTML = "";

    selectedFiles.forEach((file, i) => {
      const li = document.createElement("li");
      li.textContent = file.name;
      li.dataset.index = i;
      li.style.cursor = "move";
      li.style.padding = "4px";
      li.style.borderBottom = "1px solid #ddd"
      list.appendChild(li);
    });
    Sortable.create(list);
  });

  document.getElementById("renderBtn").addEventListener("click", () => {
    const listItems = [...document.querySelectorAll("#fileList li")];
    const reordered = listItems.map(li => selectedFiles[li.dataset.index]);
    handleFiles(reordered);
  });
  // 🔄 共通読み込み関数
  function handleFiles(fileList) {
    const files = [...fileList];
    const datasets = [];
    let loaded = 0;

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const lines = e.target.result.trim().split("\n");
        const offsetValue = parseFloat(offsetInput.value) || 0;
        const offset = index * offsetValue;
        const dataPoints = lines.map(line => {
          const [x, y] = line.split(",").map(Number);
          return { x, y: y + offset };
        });

        datasets.push({
          label: file.name,
          data: dataPoints,
          borderColor: "red",
          borderWidth: 1.5,
          fill: false,
          pointRadius: 0,
          tension: 0
        });

        loaded++;
        if (loaded === files.length) {
          if (chart) chart.destroy();
          drawChart(datasets);
        }
      };
      reader.readAsText(file);
    });
  }

  function drawChart(datasets) {
    const fontSize = parseInt(document.getElementById("labelFontSize").value) || 20;
    const offset = parseInt(document.getElementById("labelOffset").value) || 60;
    chart = new Chart(document.getElementById("lineChart"), {
      type: "line",
      data: { datasets },
      options: {
        animation: {
          responsive: false,
          onComplete: () => {
            const chartArea = chart.chartArea;
            const ctx = chart.ctx;

            ctx.save();
            ctx.fillStyle = "black"; // 背景が黒の場合
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.translate(chartArea.left - offset, chartArea.top + chartArea.height / 2);
            ctx.rotate(-Math.PI / 2); // 縦書きに回転

            // イタリック部分
            ctx.font = `italic ${fontSize}px serif`;
            ctx.fillText("Intensity", 0, 0);

            // 通常書体部分
            const italicWidth = ctx.measureText("Intensity").width;
            ctx.font = `normal ${fontSize}px serif`;
            ctx.fillText(" (a.u.)", italicWidth + 4.6, 0);

            ctx.restore();
          }
        },

        layout: {
          padding: {
            right: 50,
            left: 50
          }
        },
        plugins: {
          legend: { display: true }
        },
        scales: {
          x: {
            type: "linear",
            min: 2,
            max: 80,
            title: {
              color: "black",
              display: true,
              text: "2θ (°)",
              font: { size: fontSize, family: "serif" }
            },
            ticks: {
              stepSize: 10,
              padding: 10,
              color: "000",
              callback: v => v % 10 === 0 ? v : ""
            },
            grid: {
              drawTicks :true,
              tickLength: -6,
              drawOnChartArea: false,
              tickColor: "black",
              lineWidth: 2,
            },
          },
          y: {
            title: {
              display: false,
              color: "black",
              text: "Intensity (a.u)",
              font: { size: 24, family: "serif" }
            },
            ticks: {
              display: false,
              color: "#000"
            },
            grid: {
              display: false
            }
          }
        }
      },
      plugins: [borderBoxPlugin]
    });
  }

  const borderBoxPlugin = {
    id: 'borderBox',
    afterDraw(chart) {
      const ctx = chart.ctx;
      const area = chart.chartArea;

      ctx.save();
      ctx.strokeStyle = "#000";     // 黒色
      ctx.lineWidth = 2;            // 線の太さ
      ctx.strokeRect(area.left, area.top, area.right - area.left, area.bottom - area.top);
      ctx.restore();
    }
  };


  // 🧲 ドラッグ＆ドロップ対応
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("hover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("hover");
  });



  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("hover");

    const newFiles = [...e.dataTransfer.files];
    selectedFiles = selectedFiles.concat(newFiles);

    const list = document.getElementById("fileList");
    list.innerHTML = "";
    selectedFiles.forEach((file, i) => {
      const li = document.createElement("li");
      li.textContent = file.name;
      li.dataset.index = i;
      li.style.cursor = "move";
      li.style.padding = "4px";
      li.style.borderBottom = "1px solid #ddd";
      list.appendChild(li);
    });

    Sortable.create(list);
  });


  // 🖨 PDF保存機能
  downloadBtn.addEventListener("click", () => {
    const canvas = document.getElementById("lineChart");
    const imageData = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height + 100]
    });

    pdf.text("XRD Overlay Graph", 20, 30);
    pdf.addImage(imageData, "PNG", 10, 40, canvas.width, canvas.height);
    pdf.save("XRD_Overlay.pdf");
  });
});
