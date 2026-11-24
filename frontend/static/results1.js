(function () {

  const CLASS_NAMES = ['Gloves', 'Hard_hat', 'Mask', 'Person', 'Safety_boots', 'Vest'];

  function qs(key) {
    return new URLSearchParams(window.location.search).get(key);
  }

  const id = qs("id");
  if (!id) return;

  const imgEl = document.getElementById("annotatedImg");
  const zoomImg = document.getElementById("zoomImg");
  const zoomModal = document.getElementById("zoomModal");
  const summaryStats = document.getElementById("summaryStats");
  const detectionsTable = document.querySelector("#detectionsTable tbody");
  const metaInfo = document.getElementById("metaInfo");
  const downloadBtn = document.getElementById("downloadBtn");

  fetch(`/api/result/${id}/`)
      .then(r => r.json())
      .then(doc => render(doc));

  function render(doc) {

      imgEl.src = doc.annotated_path;
      zoomImg.src = doc.annotated_path;
      downloadBtn.href = doc.annotated_path;

      metaInfo.innerHTML = "";

      // TABLE
      detectionsTable.innerHTML = "";
      const counts = {};

      doc.classes.forEach((cls, i) => {
          const label = CLASS_NAMES[cls] || `Class ${cls}`;
          const conf = doc.confidences[i];
          const box = doc.boxes[i];

          counts[label] = (counts[label] || 0) + 1;

          const tr = document.createElement("tr");
          tr.innerHTML = `
              <td>${i+1}</td>
              <td>${label}</td>
              <td>${conf.toFixed(2)}</td>
              <td>${box.map(n => Math.round(n)).join(", ")}</td>
          `;
          detectionsTable.appendChild(tr);
      });

      // SUMMARY PILLS
      summaryStats.innerHTML = "";
      Object.entries(counts).forEach(([cls, n]) => {
          const div = document.createElement("div");
          div.className = "stat-pill";
          div.textContent = `${cls}: ${n}`;
          summaryStats.appendChild(div);
      });

      // CHART
      buildChart(doc);
  }

  function buildChart(doc) {
      const ctx = document.getElementById("confChart");

      const labels = doc.classes.map(c => CLASS_NAMES[c]);
      const data = doc.confidences;

      new Chart(ctx, {
          type: "bar",
          data: {
              labels,
              datasets: [{
                  label: "Confidence",
                  data,
                  backgroundColor: "rgba(8, 14, 79, 0.85)",
                  borderRadius: 6
              }]
          },
          options: {
              scales: {
                  y: {
                      beginAtZero: true,
                      max: 1
                  }
              },
              plugins: {
                  legend: { display: false }
              }
          }
      });
  }

  // ZOOM
  document.getElementById("zoomBtn").onclick = () => zoomModal.classList.add("active");
  document.getElementById("closeZoom").onclick = () => zoomModal.classList.remove("active");
  zoomModal.onclick = (e) => {
      if (e.target === zoomModal) zoomModal.classList.remove("active");
  };

  // BACK
  document.getElementById("backBtn").onclick = () => (window.location.href = "/");

})();
