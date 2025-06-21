let chart; //chart 定義
let selectedFiles = []; //空のファイルボックスを作成

document.addEventListener("DOMContentLoaded", () => { //ページのHTML構造（DOM）が読み込まれたら、指定した処理を実行する
  const fileInput = document.getElementById("fileInput"); // HTMLの中からid"fileInput"の要素を取得し定数fileInputに代入
  const downloadBtn = document.getElementById("downloadBtn");//上と同じ
  const dropZone = document.getElementById("dropZone");
  const offsetInput = document.getElementById("offsetInput");

  //ファイル選択
  fileInput.addEventListener("change", (e) => { //fileInputの値が変化した時に処理を実行 eのおかげでどのファイルが選ばれたかなどの情報を取得できる
    selectedFiles = selectedFiles.concat([...e.target.files]);  //e.target.files に含まれる選択ファイルたちを selectedFiles に追加していく.
    //スプレッド構文[...]を使って、FileListを普通の配列に変換している。concat() は配列をつなげて新しい配列を返すメソッド
    const list = document.getElementById("fileList"); //HTMLの中からid"fileList"の要素を取得し定数として扱う
    list.innerHTML = ""; //list の中をリセット

    selectedFiles.forEach((file, i) => { //selectedfilesの全ての要素に関数を実行する
      const li = document.createElement("li"); //li要素をHTMLに作成
      li.textContent = file.name; //ファイル名をテキストコンテンツとして表示
      li.dataset.index = i; //HTMLの data-* 属性を設定します
      li.style.cursor = "move"; //カーソルを「ドラッグできる手のマーク」にする
      li.style.padding = "4px"; //内側の余白を追加して見やすく
      li.style.borderBottom = "1px solid #ddd" //下に線を引く
      list.appendChild(li); //DOMメソッドのひとつで、指定した要素を「子要素として末尾に追加」
    });
    Sortable.create(list); //list 内の <li> 要素を ドラッグ＆ドロップで並び替え可能に
  });

  document.getElementById("renderBtn").addEventListener("click", () => {  //HTMLの中からid"renderBtn"の要素を取得し、クリックされた時の処理を設定する
    const listItems = [...document.querySelectorAll("#fileList li")]; //定数listItemsにfileListのli要素を全て取得し、純粋な配列に変換し、格納する
    const reordered = listItems.map(li => selectedFiles[li.dataset.index]); //定数reorderedにlistItemsのli要素から<li data-index="X"> の X の部分を取り出しファイルを並べ替える
    handleFiles(reordered);//ファイルを表示したりする関数にreorderedを入れる
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
