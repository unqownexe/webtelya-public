const WebSocket = require('ws');
const fs = require('fs');
const http = require('http');
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
let fastPDscr = false
const PORT = 3000;
const FILE_PATH = path.join(__dirname, 'vehicles.json');

if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify({}));
}
app.use(cors());
app.use(express.json());

const readData = () => {
    if (!fs.existsSync(FILE_PATH)) {
        fs.writeFileSync(FILE_PATH, JSON.stringify({}));
    }
    const data = fs.readFileSync(FILE_PATH, 'utf8');
    return JSON.parse(data);
};

// JSON dosyasına yazan yardımcı fonksiyon
const writeData = (data) => {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 4));
};

// 1. Tüm araç isimlerini getir (GET)
app.get('/api/vehicles', (req, res) => {
    const data = readData();
    res.json(data);
});

// 2. Yeni araç ekle veya var olanı güncelle (POST)
// Örnek Body: { "plate": "81AGJ067", "name": "Yeni Özel İsim" }
app.post('/api/vehicles', (req, res) => {
    const { plate, name } = req.body;

    if (!plate || !name) {
        return res.status(400).json({ error: "Plaka ve isim alanları zorunludur." });
    }

    const data = readData();
    data[plate] = name; // Veriyi ekle veya üstüne yaz
    writeData(data);

    res.json({ message: "Başarıyla güncellendi.", plate, name });
});

// 3. Özel araç ismini sil (DELETE)
app.delete('/api/vehicles/:plate', (req, res) => {
    const { plate } = req.params;
    const data = readData();

    if (data[plate]) {
        delete data[plate];
        writeData(data);
        res.json({ message: "Kayıt başarıyla silindi.", plate });
    } else {
        res.status(404).json({ error: "Bu plakaya ait kayıt bulunamadı." });
    }
});

app.listen(PORT, () => {
    console.log(`Express API çalışıyor: http://localhost:${PORT}`);
});

app.use(express.json());
const vehiclesData = fs.readFileSync('vehicles.json', 'utf8');
async function main() {
    console.log("🔍 FiveM sistemleri taranıyor...");

    const targets = await fetchTargets();
    let ws_url = null;
    let baglanti_turu = "";

    for (const target of targets) {
        if (target.url.includes("lb-phone")) {
            ws_url = target.webSocketDebuggerUrl;
            baglanti_turu = "Telefon Doğrudan";
            break;
        }
    }
    if (!ws_url) {
        for (const target of targets) {
            if (target.url.includes("root.html")) {
                ws_url = target.webSocketDebuggerUrl;
                baglanti_turu = "Ana Ekran (Iframe Sızması)";
                break;
            }
        }
    }
    if (!ws_url) {
        console.log("❌ Telefon veya oyun arayüzü bulunamadı.");
        process.exit(1);
    }



    console.log(`✅ Bağlantı Kuruldu! Yöntem: [${baglanti_turu}]`);
    // console.log(`⏳ Raporlar tek tek çekilip anında kaydedilecek (${BASLANGIC_ID} - ${BITIS_ID} arası)...\n`);

    //fs.mkdirSync(ANA_KLASOR, { recursive: true });

    const ws = new WebSocket(ws_url);
    let basarili_sayisi = 0;

    ws.on('open', async () => {
        console.log("Phone Script Initialized");


        const notifyCode = `
(async function(){
    let noaUIFrame = document.querySelector('iframe[src*="noa-ui"]');
    if (!noaUIFrame) return;
    
    let noaUIFrameDoc = noaUIFrame.contentDocument || noaUIFrame.contentWindow.document;

    window.top.ShowNotify = function (text, type = "error", duration = 5000) {
        const container = noaUIFrameDoc.querySelector(".noa-notify-container");
        if (!container) return;

        const colors = {
            error: "rgb(255, 103, 103)",
            success: "rgb(103, 255, 103)",
            warning: "rgb(255, 200, 103)",
            info: "rgb(103, 180, 255)",
            base: "rgb(255, 255, 188)"
        };

        const icons = {
            error: "https://cfx-nui-noa-ui/web/dist/assets/icon-error-DCQBrHIV.svg",
            success: "https://cfx-nui-noa-ui/web/dist/assets/icon-success-CbO5l7dW.svg",
            warning: "https://cfx-nui-noa-ui/web/dist/assets/icon-warning-DM7tJYgB.svg",
            info: "https://cfx-nui-noa-ui/web/dist/assets/icon-info-Dn2uLw5m.svg",
            base: "https://cfx-nui-noa-ui/web/dist/assets/icon-base-D0AFjp2N.svg"
        };

        const notify = noaUIFrameDoc.createElement("div");
        notify.setAttribute("data-v-1fad6a05", "");
        notify.className = "noa-notify";

        notify.innerHTML = \`
            <img data-v-1fad6a05="" src="\${icons[type] || icons.error}" class="noa-notify-icon" alt="">
            <span data-v-1fad6a05="" class="noa-notify-text" style="color:\${colors[type] || colors.error}">
                \${text}
            </span>
        \`;

        container.appendChild(notify);

        setTimeout(() => {
            notify.remove();
        }, duration);
    };

    window.top.ShowNotify("Notify Loaded.", "base");
})()`;

        const mesaj_notify = {
            id: 2,
            method: "Runtime.evaluate",
            params: { expression: notifyCode, awaitPromise: true, returnByValue: true }
        };

        ws.send(JSON.stringify(mesaj_notify));


        const fpsBoost = `
        (async function() {

        const BlackList = [
            "gnd_mechanic",
            "WaveShield",
            "ElectronAC"
        ];

        document.querySelectorAll("iframe").forEach(script => {
            const name = script.getAttribute("name");
            //window.top.ShowNotify(name, "base");

            if (BlackList.includes(name)) {
               script.remove();
               window.top.ShowNotify(name + " | Deleted.", "base");
            }
        });
        window.top.ShowNotify("FPS Boost Loaded.", "base");

    })();
`;

        const mesaj_fpsBoost = {
            id: 2,
            method: "Runtime.evaluate",
            params: { expression: fpsBoost, awaitPromise: true, returnByValue: true }
        };

        ws.send(JSON.stringify(mesaj_fpsBoost));

        const phoneapp = `
        (async function() {
        let phoneFrame = document.querySelector('iframe[src*="cylex_phone"]')
        let phoneFrameDoc = phoneFrame.contentDocument || phoneFrame.contentWindow.document;
        let appLocation = phoneFrameDoc.querySelector("#app > div > div.phone-container > div > div.phone-container-in > div.phone-main > div.control-center-container.active > div.control-inner-container > div:nth-child(3) > div");
        let phoneAppDedect = phoneFrameDoc.querySelector('.ue-extra-app')
        if(phoneAppDedect){
            phoneAppDedect.remove()
            phoneFrameDoc.querySelector('[data-app="ueui"]')?.remove()
        }
        let appHTML = \`
        <div class="ue-extra-app"> 
        <style>
        .mini-button-extra {
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mini-button-extra img {
    display: none;
}

.mini-button-extra::after {
    content: "UE";
    color: #fff;
    font-size: 18px;
    font-weight: 700;
}
    </style>
            <div data-v-b9c61d3c="" class="mini-button mini-button-extra">
                <img data-v-b9c61d3c="" src="images/icons/controlCenter/calculator-icon.png" alt="">
            </div>
        </div>
        \`
        appLocation.innerHTML += appHTML;
        
        let appUI = \`
        <div class="app-host ios-anim-wrapper is-active" data-app="ueui" style="">
  <div data-v-ad3a44dc="" class="messages-main-container" style="">
    <div data-v-ad3a44dc="" class="messages-container">
      <div data-v-ad3a44dc="" class="messages-top">
        <p data-v-ad3a44dc="">Mesajlar</p>
        <div data-v-ad3a44dc="" class="new-message-button">
          <i data-v-ad3a44dc="" class="fa-solid fa-pen-to-square"></i>
        </div>
      </div>
      <div data-v-ad3a44dc="" class="messages-boxes-container">
        <div data-v-ad3a44dc="" class="search-container">
          <i data-v-ad3a44dc="" class="fa-solid fa-search"></i>
          <input data-v-ad3a44dc="" type="text" placeholder="Ara..." spellcheck="false">
        </div>
        <div data-v-9584746b="" data-v-ad3a44dc="" class="scroll-container">
          <div data-v-9584746b="" id="scroll-trigger-top"></div>
          <div data-v-a385a1f7="" data-v-ad3a44dc="" class="message-main-box">
            <div data-v-a385a1f7="" class="messages-boxes">
              <!---->
              <div data-v-a385a1f7="" class="image-circle">
                <img data-v-a385a1f7="" src="images/icons/default-user.png" alt="">
              </div>
              <div data-v-a385a1f7="" class="messages-texts">
                <div data-v-a385a1f7="" class="message-top-text">
                  <p data-v-a385a1f7="" class="name">5550000</p>
                  <div data-v-a385a1f7="" class="message-right-part">
                    <p data-v-a385a1f7="">1 saat önce</p>
                    <i data-v-a385a1f7="" class="fas fa-chevron-right"></i>
                  </div>
                </div>
                <div data-v-a385a1f7="" class="message-bottom-text">
                  <p data-v-a385a1f7="">Konum</p>
                </div>
              </div>
            </div>
          </div>
          <div data-v-9584746b="" id="scroll-trigger-bottom"></div>
        </div>
      </div>
    </div>
  </div>
</div>
\`


        phoneFrameDoc.querySelector('.phone-main').innerHTML += appHTML;

        let newApp = appLocation.querySelector(".ue-extra-app");
        newApp.addEventListener("click", () => {
            window.top.ShowNotify("Extra App Clicked.", "base");
        });

        window.top.ShowNotify("Phone App Loaded., sex", "base");

        })();
        `
        const mesaj_phoneapp = {
            id: 3,
            method: "Runtime.evaluate",
            params: { expression: phoneapp, awaitPromise: true, returnByValue: true }
        };

        ws.send(JSON.stringify(mesaj_phoneapp));


        const addPD_kit = `
        (async function() {
            // İlk yükleme bildirimleri (Döngünün dışında, sadece 1 kere çalışır)
            if (window.top.ShowNotify) {
                window.top.ShowNotify("PD Kit Loading", "base");
            }

            let PDKitHTML = \`
            <button class="pdkitcanavari px-3 py-2 rounded text-left transition-all bg-[#1A1B1F] border border-[#2A2B31] text-gray-400 hover:border-[#3A3B41] hover:text-gray-300">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="box-open" class="svg-inline--fa fa-box-open text-sm" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                    <path fill="currentColor" d="M36.8 192L320 336 603.2 192 320 48 36.8 192zM0 220.8V384c0 17.7 9.6 34 25.1 42.5l256 128c24.4 12.2 53.3 12.2 77.7 0l256-128c15.5-8.5 25.1-24.8 25.1-42.5V220.8L336.9 374.4c-10.5 5.3-22.7 5.3-33.8 0L0 220.8z"></path>
                  </svg>
                  <span class="text-xs font-medium">Kit</span>
                </div>
                <span class="text-xs font-semibold">Seç</span>
              </div>
            </button>
            \`;

            if (window.top.__pdKitInterval) {
                clearInterval(window.top.__pdKitInterval);
                window.top.__pdKitInterval = undefined;
                console.log("Eski PD Kit döngüsü temizlendi.");
            }

            let notifiedLoaded = false;

            window.top.__pdKitInterval = setInterval(() => {
                let shopFrame = document.querySelector('iframe[src*="lation_shops"]');
                if (!shopFrame) return; // Iframe henüz yüklenmediyse bekle

                let shopFrameDoc = shopFrame.contentDocument || shopFrame.contentWindow.document;
                if (!shopFrameDoc) return;

                let PD_KitLoc = shopFrameDoc.querySelector('#root > div:nth-child(1) > div > div > div.flex.flex-1.overflow-hidden > div.w-80.flex.flex-col > div:nth-child(2) > div > div');
                if (!PD_KitLoc) return; // Hedef element henüz yoksa bekle

                // EĞER BUTON ZATEN VARSA HİÇBİR ŞEY YAPMA
                if (PD_KitLoc.querySelector('.pdkitcanavari')) {
                    // Sadece ilk seferde "Loaded" bildirimi gönder
                    if (!notifiedLoaded && window.top.ShowNotify) {
                        window.top.ShowNotify("PD Kit Loaded.", "base");
                        notifiedLoaded = true;
                    }
                    return; 
                }

                // Buton yoksa ekle
                PD_KitLoc.insertAdjacentHTML('beforeend', PDKitHTML);

                let btn = shopFrameDoc.querySelector('.pdkitcanavari');
                if (btn) {
                    btn.addEventListener('click', () => {
                        if (window.top.ShowNotify) {
                            window.top.ShowNotify("PD Kit Clicked.", "base");
                        }

                        const iframe = shopFrameDoc.createElement('iframe');
                        iframe.style.display = 'none';
                        shopFrameDoc.body.appendChild(iframe);
                        const cleanFetch = iframe.contentWindow.fetch;

                        cleanFetch("https://lation_shops/shopPurchase", {
                            method: "POST",
                            headers: {
                                "content-type": "application/json; charset=UTF-8"
                            },
                            body: JSON.stringify({
                                cart: [
                        { quantity: 1, listingId: 1800 },
                        { quantity: 1, listingId: 1801 },
                        { quantity: 350, listingId: 1802 },
                        { quantity: 1, listingId: 1803 },
                        { quantity: 30, listingId: 1804 },
                        { quantity: 1, listingId: 1805 },
                        { quantity: 1, listingId: 1806 },
                        { quantity: 15, listingId: 1807 },
                        { quantity: 7, listingId: 1808 },
                        { quantity: 1, listingId: 1809 },
                        { quantity: 1, listingId: 1810 },
                        { quantity: 1, listingId: 1811 },
                        { quantity: 1, listingId: 1812 },
                        { quantity: 1, listingId: 1813 },
                        { quantity: 1, listingId: 1814 },
                        { quantity: 1, listingId: 1815 },
                        { quantity: 1, listingId: 1816 },
                        { quantity: 5, listingId: 1817 },
                        { quantity: 1, listingId: 1818 }
                    ],
                                total: 0,
                                paymentMethod: "bank"
                            })
                        })
                        .then(response => response.json())
                        .then(data => console.log("Başarılı:", data))
                        .catch(error => console.error("Hata:", error))
                        .finally(() => {
                            // İşlem bitince geçici iframe'i temizle
                            setTimeout(() => iframe.remove(), 1000);
                        });
                    });
                }

            }, 500);
        })();`

        const mesaj_pdkit = {
            id: 4,
            method: "Runtime.evaluate",
            params: { expression: addPD_kit, awaitPromise: true, returnByValue: true }
        };
        ws.send(JSON.stringify(mesaj_pdkit))


        const FastPD = `
(async function () {
    window.top.ShowNotify("Fast PD Started", "base");
    if (window.top.fastPDInterval) {
        clearInterval(window.top.fastPDInterval);
        delete window.top.fastPDInterval;
    }

    window.top.fastPDInterval = setInterval(function () {
        const nuiFrame = document.querySelector('iframe[src*="noa-ui"]');
        if (!nuiFrame) return console.log('nuiFrame not found');

        const nuiFrameDoc = nuiFrame.contentDocument || nuiFrame.contentWindow.document;
        if (!nuiFrameDoc) return console.log('nuiFrameDoc not found');

        const progress = nuiFrameDoc.querySelector('#app .noa-progress-container');
        if (!progress) return

        const aktifFetch = nuiFrame.contentWindow.fetch;

        const title = progress.querySelector('.noa-progress-label')?.textContent.trim();
        const percentNumber = Number(progress.querySelector('.noa-progress-percent')?.textContent.trim().replace('%', ''))

        console.log({
            title,
            percentNumber
        });

        const veri = [
                {
                    title: "Araçtan indiriliyor...",
                    percent: 10
                },
                {
                    title: "Taşınıyor...",
                    percent: 10
                },
                {
                    title: "Araca bindiriliyor...",
                    percent: 10
                },
                {
                    title: "PD bandaj kullanılıyor...",
                    percent: 60
                },
                {
                    title: "Bırakılıyor...",
                    percent: 10
                }
            ];

            const eslesen = veri.find(v => v.title === title);

            if (
                eslesen &&
                percentNumber >= (eslesen.percent - 5) &&
                percentNumber <= (eslesen.percent + 15)
            ) {
                aktifFetch("https://noa-ui/FinishAction", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json; charset=UTF-8"
                    },
                    body: "{}"
                });
            }

    }, 500);
    window.top.ShowNotify("Fast PD Loaded.", "base");
})();
`;

        const mesaj_fastpd = {
            id: 1,
            method: "Runtime.evaluate",
            params: { expression: FastPD, awaitPromise: true, returnByValue: true }
        };
        if (fastPDscr) ws.send(JSON.stringify(mesaj_fastpd));

        const CustomVehicleNames = `(async function () {
    if (window.top.ShowNotify) window.top.ShowNotify("Gelişmiş İsimlendirici Başlatıldı (Hızlı Mod)", "base");

    if (window.top.vehicleDataInterval) clearInterval(window.top.vehicleDataInterval);
    if (window.top.vehicleDomInterval) clearInterval(window.top.vehicleDomInterval);

    let customNames = {};

    // --- ESKİ KALINTILARI TEMİZLEME (Hata Çözümü) ---
    const cleanOldUI = (doc) => {
        const oldModal = doc.getElementById('tgi-rename-modal');
        if (oldModal) oldModal.remove(); // Eski pencereyi sil ki yenisi (Sil butonlu olan) yüklenebilsin
    };
    
    cleanOldUI(document);
    document.querySelectorAll('iframe').forEach(iframe => {
        try { if (iframe.contentDocument) cleanOldUI(iframe.contentDocument); } catch(e){}
    });
    // ------------------------------------------------

    // Fetch Hook
    let aktifFetch = window.fetch;
    if (window.location.href.includes("root.html")) {
        const tabletIframe = document.querySelector('iframe[src*="lb-tablet"]');
        if (tabletIframe) aktifFetch = tabletIframe.contentWindow.fetch;
        else {
            const parkingIframe = document.querySelector('iframe[src*="tgiann-realparking"]') || document.querySelector('iframe[name*="tgiann-realparking"]');
            if (parkingIframe) aktifFetch = parkingIframe.contentWindow.fetch;
        }
    }

    const injectGlobalModal = () => {
        let targetDoc = document;
        const nuiFrame = document.querySelector('iframe[name*="tgiann-realparking"]') || document.querySelector('iframe[src*="tgiann-realparking"]');
        if (nuiFrame) targetDoc = nuiFrame.contentDocument || nuiFrame.contentWindow.document;
        if (!targetDoc) return;

        if (!targetDoc.getElementById('tgi-rename-modal')) {
            const modalHTML = \`
            <div id="tgi-rename-modal" style="display: none; position: absolute; inset: 0; background: rgba(15, 15, 15, 0.85); z-index: 9999; justify-content: center; align-items: center; backdrop-filter: blur(4px); transition: opacity 0.2s;">
                <div style="background: rgba(34, 34, 34, 0.9); border: 0.1vh solid rgba(255, 255, 255, 0.1); border-radius: 1vh; padding: 2.5vh; width: 35vh; display: flex; flex-direction: column; gap: 1.5vh; box-shadow: 0 1vh 3vh rgba(0,0,0,0.5);">
                    <div style="color: white; font-family: Agrandir, sans-serif; font-size: 2vh; font-weight: bold;">Özel Araç İsimlendir</div>
                    
                    <input id="modal-plate-input" type="text" placeholder="Plaka" disabled style="background: rgba(255, 255, 255, 0.02); border: 0.1vh solid rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.5); padding: 1.2vh; border-radius: 0.5vh; outline: none; font-size: 1.4vh; width: 100%; box-sizing: border-box; cursor: not-allowed;">
                    
                    <input id="modal-name-input" type="text" placeholder="Yeni İsim (Örn: Sivil Birlik)" style="background: rgba(255, 255, 255, 0.05); border: 0.1vh solid rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.8); padding: 1.2vh; border-radius: 0.5vh; outline: none; font-size: 1.4vh; width: 100%; box-sizing: border-box;">
                    
                    <div style="display: flex; gap: 1vh; justify-content: flex-end; margin-top: 1vh; align-items: center;">
                        <button id="modal-delete-btn" style="display: none; margin-right: auto; background: rgba(255, 71, 71, 0.1); border: 0.1vh solid rgba(255, 71, 71, 0.3); color: #ff4747; cursor: pointer; padding: 1vh 1.5vh; font-size: 1.4vh; border-radius: 0.5vh; transition: 0.2s;">Sil</button>
                        <button id="modal-cancel-btn" style="background: transparent; border: none; color: rgba(255, 255, 255, 0.6); cursor: pointer; padding: 1vh 1.5vh; font-size: 1.4vh; border-radius: 0.5vh; transition: 0.2s;">İptal</button>
                        <button id="modal-save-btn" style="background: #36ff9f; border: none; color: #252525; font-weight: bold; cursor: pointer; padding: 1vh 2vh; font-size: 1.4vh; border-radius: 0.5vh; transition: 0.2s;">Kaydet</button>
                    </div>
                </div>
            </div>\`;
            targetDoc.body.insertAdjacentHTML('beforeend', modalHTML);

            const closeModal = () => { targetDoc.getElementById('tgi-rename-modal').style.display = 'none'; };

            targetDoc.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

            targetDoc.getElementById('modal-save-btn').addEventListener('click', async () => {
                const plate = targetDoc.getElementById('modal-plate-input').value.trim();
                const name = targetDoc.getElementById('modal-name-input').value.trim();

                if (!name) return window.top.ShowNotify("İsim boş bırakılamaz!", "error");

                customNames[plate] = name;
                closeModal();
                if (window.top.ShowNotify) window.top.ShowNotify(\`[\${plate}] anında kaydedildi.\`, "success");

                try {
                    await aktifFetch("http://localhost:3000/api/vehicles", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ plate, name })
                    });
                } catch (err) {
                    console.log("KAYIT HATASI:", err);
                }
            });

            targetDoc.getElementById('modal-delete-btn').addEventListener('click', async () => {
                const plate = targetDoc.getElementById('modal-plate-input').value.trim();

                delete customNames[plate];
                closeModal();
                if (window.top.ShowNotify) window.top.ShowNotify(\`[\${plate}] özel ismi silindi.\`, "error");

                try {
                    await aktifFetch(\`http://localhost:3000/api/vehicles/\${plate}\`, { method: "DELETE" });
                } catch (err) {
                    console.log("SİLME HATASI:", err);
                }
            });
        }
    };

    const fetchVehicleData = async () => {
        try {
            const response = await aktifFetch("http://localhost:3000/api/vehicles", { method: "GET" });
            if (response.ok) customNames = await response.json();
        } catch (error) {}
    };

    fetchVehicleData();
    window.top.vehicleDataInterval = setInterval(fetchVehicleData, 5000);

    window.top.vehicleDomInterval = setInterval(function () {
        injectGlobalModal();
        
        let targetDoc = document;
        const nuiFrame = document.querySelector('iframe[name*="tgiann-realparking"]') || document.querySelector('iframe[src*="tgiann-realparking"]');
        if (nuiFrame) targetDoc = nuiFrame.contentDocument || nuiFrame.contentWindow.document;
        if (!targetDoc) return;

        const plateElements = targetDoc.querySelectorAll('.text-tgi-green');
        const svgPlus = \`<svg data-prefix="fas" data-icon="plus" style="width: 1.2vh; height: 1.2vh;" class="text-[#FFFFFF80] group-hover:text-[#36ff9f] transition-colors" viewBox="0 0 448 512"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"></path></svg>\`;
        const svgPen = \`<svg data-prefix="fas" data-icon="pen" style="width: 1.2vh; height: 1.2vh;" class="text-[#36ff9f] group-hover:text-white transition-colors" viewBox="0 0 512 512"><path fill="currentColor" d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z"></path></svg>\`;

        plateElements.forEach(plateEl => {
            const plateText = plateEl.textContent.trim();
            const parentRow = plateEl.closest('.flex.justify-between');
            if (!parentRow) return;

            const modelNameEl = parentRow.querySelector('.text-white');
            if (!modelNameEl) return;

            if (!modelNameEl.hasAttribute('data-orijinal-isim')) {
                modelNameEl.setAttribute('data-orijinal-isim', modelNameEl.textContent);
            }

            const isRenamed = !!customNames[plateText];

            if (isRenamed) {
                if (modelNameEl.textContent !== customNames[plateText]) {
                    modelNameEl.textContent = customNames[plateText];
                }
            } else {
                const originalName = modelNameEl.getAttribute('data-orijinal-isim');
                if (modelNameEl.textContent !== originalName) {
                    modelNameEl.textContent = originalName;
                }
            }

            const plateContainer = plateEl.parentNode;
            let inlineBtn = plateContainer.querySelector('.tgi-inline-edit-btn');
            const targetIcon = isRenamed ? svgPen : svgPlus;

            if (!inlineBtn) {
                plateContainer.insertAdjacentHTML('beforeend', \`
                    <div class="tgi-inline-edit-btn bg-[#FFFFFF1A] hover:bg-[#FFFFFF33] flex items-center justify-center rounded cursor-pointer group transition-all" style="width: 2.2vh; height: 2.2vh; margin-left: 0.5vh;" title="Düzenle">
                        \${targetIcon}
                    </div>
                \`);
                
                inlineBtn = plateContainer.querySelector('.tgi-inline-edit-btn');
                
                inlineBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    targetDoc.getElementById('modal-plate-input').value = plateText;
                    targetDoc.getElementById('modal-name-input').value = customNames[plateText] || '';
                    
                    // GÜVENLİK KONTROLÜ: Element varsa stilini değiştir
                    const deleteBtn = targetDoc.getElementById('modal-delete-btn');
                    if (deleteBtn) {
                        deleteBtn.style.display = customNames[plateText] ? 'block' : 'none';
                    }
                    
                    targetDoc.getElementById('tgi-rename-modal').style.display = 'flex';
                    targetDoc.getElementById('modal-name-input').focus();
                });
            } else {
                const currentIsPen = inlineBtn.innerHTML.includes('362.7 19.3');
                if (isRenamed && !currentIsPen) inlineBtn.innerHTML = svgPen;
                else if (!isRenamed && currentIsPen) inlineBtn.innerHTML = svgPlus;
            }
        });
    }, 500);

})();`;

        const mesaj_fastpdsex = {
            id: 1,
            method: "Runtime.evaluate",
            params: { expression: CustomVehicleNames, awaitPromise: true, returnByValue: true }
        };

        ws.send(JSON.stringify(mesaj_fastpdsex));


        ws.close();
    });
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function fetchTargets() {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:13172/json', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', () => {
            console.log("❌ FiveM yerel sunucusuna bağlanılamadı.");
            process.exit(1);
        });
    });
}

main().catch(e => console.error("❌ Hata:", e));


