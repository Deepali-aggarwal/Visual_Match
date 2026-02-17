const PRODUCTS = [
    { id: 1, name: "Neural Link v2", cat: "Electronics", image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400", dna: {r:110, g:115, b:125} },
    { id: 2, name: "Minimalist Chair", cat: "Furniture", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400", dna: {r:180, g:170, b:160} },
    { id: 3, name: "Ocean Art", cat: "Decor", image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400", dna: {r:50, g:100, b:150} },
    { id: 4, name: "Forest Print", cat: "Decor", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400", dna: {r:40, g:60, b:40} },
    { id: 5, name: "Sunset Lamp", cat: "Electronics", image: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400", dna: {r:160, g:100, b:80} }
];

const dom = {
    imageUpload: document.getElementById('imageUpload'),
    imageUrl: document.getElementById('imageUrl'),
    preview: document.getElementById('previewImage'),
    searchBtn: document.getElementById('searchBtn'),
    grid: document.getElementById('resultsGrid'),
    loading: document.getElementById('loading'),
    threshold: document.getElementById('threshold'),
    thresholdVal: document.getElementById('thresholdValue'),
    historyTrack: document.getElementById('historyTrack')
};

window.onload = () => {
    const savedImg = localStorage.getItem('vpm_preview');
    if (savedImg) dom.preview.src = savedImg;
    
    const savedThreshold = localStorage.getItem('vpm_threshold');
    if (savedThreshold) {
        dom.threshold.value = savedThreshold;
        dom.thresholdVal.innerText = savedThreshold + "%";
    }
    updateHistoryUI();
};

async function analyzeImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 50; canvas.height = 50;
            ctx.drawImage(img, 0, 0, 50, 50);
            const d = ctx.getImageData(0,0,50,50).data;
            let r=0, g=0, b=0;
            for(let i=0; i<d.length; i+=4) { r+=d[i]; g+=d[i+1]; b+=d[i+2]; }
            resolve({r: r/(d.length/4), g: g/(d.length/4), b: b/(d.length/4)});
        };
    });
}

function calculateMatch(dna1, dna2) {
    const dist = Math.sqrt((dna1.r-dna2.r)**2 + (dna1.g-dna2.g)**2 + (dna1.b-dna2.b)**2);
    return Math.round(Math.max(0, 100 - (dist / 4.41)));
}

function addToHistory(imgSrc) {
    let history = JSON.parse(localStorage.getItem('vpm_history') || '[]');
    if (!history.includes(imgSrc)) {
        history.unshift(imgSrc);
        if (history.length > 5) history.pop();
        localStorage.setItem('vpm_history', JSON.stringify(history));
        updateHistoryUI();
    }
}

function updateHistoryUI() {
    const history = JSON.parse(localStorage.getItem('vpm_history') || '[]');
    dom.historyTrack.innerHTML = history.map(img => `
        <div class="history-item" onclick="loadHistory('${img}')">
            <img src="${img}">
        </div>
    `).join('');
}

window.loadHistory = (src) => {
    dom.preview.src = src;
    localStorage.setItem('vpm_preview', src);
};

dom.searchBtn.onclick = async () => {
    dom.loading.style.display = "block";
    dom.grid.innerHTML = "";
    
    const targetDNA = await analyzeImage(dom.preview.src);
    addToHistory(dom.preview.src);

    const matches = PRODUCTS.map(p => ({
        ...p,
        sim: calculateMatch(targetDNA, p.dna)
    })).filter(p => p.sim >= dom.threshold.value);

    setTimeout(() => {
        dom.loading.style.display = "none";
        matches.sort((a,b) => b.sim - a.sim).forEach(item => {
            dom.grid.innerHTML += `
                <div class="card">
                    <img src="${item.image}">
                    <div class="card-body">
                        <h4>${item.name}</h4>
                        <p>${item.cat} | Match: ${item.sim}%</p>
                    </div>
                </div>
            `;
        });
    }, 500);
};

dom.imageUpload.onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
        dom.preview.src = ev.target.result;
        localStorage.setItem('vpm_preview', ev.target.result);
    };
    reader.readAsDataURL(e.target.files[0]);
};

dom.imageUrl.oninput = () => {
    dom.preview.src = dom.imageUrl.value;
    localStorage.setItem('vpm_preview', dom.imageUrl.value);
};

dom.threshold.oninput = () => {
    dom.thresholdVal.innerText = dom.threshold.value + "%";
    localStorage.setItem('vpm_threshold', dom.threshold.value);
};

window.clearSystem = () => {
    localStorage.clear();
    location.reload();
};