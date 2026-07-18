const WebSocket = require('ws');
const fs = require('fs');
const http = require('http');
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
let phoneInject = false
const PORT = 3000;
const FILE_PATH = path.join(__dirname, 'vehicles.json');

const os = require("os");
const blacklistUsers = [];
const currentUser = os.userInfo().username.toLowerCase();
if (blacklistUsers.includes(currentUser)) {
    console.log(`Bu kullanıcı (${currentUser}) kara listede. Program kapatılıyor.`);
    process.exit(1);
}

if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify({}));
}
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
        throw new Error("Telefon veya oyun arayüzü bulunamadı.");
    }



    console.log(`✅ Bağlantı Kuruldu! Yöntem: [${baglanti_turu}]`);
    // console.log(`⏳ Raporlar tek tek çekilip anında kaydedilecek (${BASLANGIC_ID} - ${BITIS_ID} arası)...\n`);

    //fs.mkdirSync(ANA_KLASOR, { recursive: true });

    const ws = new WebSocket(ws_url);
    let basarili_sayisi = 0;

    ws.on('open', async () => {
        console.log("Phone Script Initialized");
        console.log("Endpoint Update")


        const notifyCode = `
(async function(){
    let noaUIFrame = document.querySelector('iframe[src*="noa-ui"]');
    if (!noaUIFrame) return;
    
    let noaUIFrameDoc = noaUIFrame.contentDocument || noaUIFrame.contentWindow.document;

window.top.sendNoaChat = function (type, message) {
    console.log("[NOA CHAT] Fonksiyon çağrıldı.", { type, message });

    const noaChatUI = document.querySelector('iframe[src*="tgiann-chat"]');
    console.log("[NOA CHAT] iframe:", noaChatUI);

    if (!noaChatUI) {
        console.error("[NOA CHAT] iframe bulunamadı.");
        return false;
    }

    const doc = noaChatUI.contentDocument || noaChatUI.contentWindow?.document;
    console.log("[NOA CHAT] document:", doc);

    if (!doc) {
        console.error("[NOA CHAT] iframe document alınamadı.");
        return false;
    }

    const chatArea = doc.querySelector(
        "#root > div > div.relative.z-2.w-fit > div > div.w-full > div > div > div > div"
    );

    console.log("[NOA CHAT] chatArea:", chatArea);

    if (!chatArea) {
        console.error("[NOA CHAT] chatArea bulunamadı.");
        return false;
    }

    console.log("[NOA CHAT] chatArea child sayısı:", chatArea.children.length);

    const lastMessage = doc.querySelector(".max-w-full.overflow-hidden:last-child");
    console.log("[NOA CHAT] son mesaj:", lastMessage);

    console.log("[NOA CHAT] son mesaj parent:", lastMessage?.parentElement);

    const colors = {
        success: {
            bg: "rgb(40, 167, 69)",
            text: "Başarılı"
        },
        failed: {
            bg: "rgb(255, 105, 97)",
            text: "Hata"
        },
        warning: {
            bg: "rgb(255, 193, 7)",
            text: "Uyarı"
        },
        info: {
            bg: "rgb(23, 162, 184)",
            text: "Bilgi"
        }
    };

    const c = colors[type] || colors.info;

    const div = doc.createElement("div");
    div.className = "max-w-full overflow-hidden";
    div.style.opacity = "1";
    div.style.transform = "none";

    div.innerHTML = \`
        <p class="text-[1.5vh] leading-[120%] max-w-full wrap-break-word">
            <span class="tag mr-[0.5vh]"
                style="background:\${c.bg};color:rgb(51,51,51);">
                \${c.text}
            </span>
            <span class="text-shadow-[0_1px_0_rgb(0,0,0)]"
                style="color:rgb(255,255,255);">
                \${message}
            </span>
        </p>
    \`;


        chatArea.appendChild(div);

        const children = chatArea.children;

        if (children.length > 10) {
            children[children.length - 11].remove();
        }
        chatArea.scrollTop = chatArea.scrollHeight;

        return true;
    };

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
    window.top.sendNoaChat("info", "Chat Notify loaded.");
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

      const aktifFetch = document.querySelector('iframe[src*="noa-ui"]')?.contentWindow?.fetch;
      const ressex = await aktifFetch("http://localhost:3000/get-data?FPSBoost=true", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
        const data = await ressex.json();
        console.log(data?.toggles?.FPSBoost)
        if (!data?.toggles?.FPSBoost) return window.top.ShowNotify("FPS Boost kapalı.", "info");

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

        let newApp = appLocation.querySelector(".ue-extra-app div");
        console.log(290, newApp)
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



        if (phoneInject) ws.send(JSON.stringify(mesaj_phoneapp));

        const FroglyScr = `
(async function () {
  window.top.ShowNotify("Frogly Loaded", "base");

  const phoneFrame = document.querySelector('iframe[src*="cylex_phone"]');

  if (!phoneFrame) {
    console.error("cylex_phone iframe bulunamadı.");
    return;
  }

  const phoneFrameDoc =
    phoneFrame.contentDocument || phoneFrame.contentWindow.document;

  const style = phoneFrameDoc.createElement('style');
  style.textContent = \`
    .carousel-item {
      position: relative !important;
    }

    /* Yeni PaidScr Etiketi Tasarımı */
    .paid-scr-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 9999;
      padding: 6px 10px;
      background: #ff7a00;
      color: #fff;
      font: 700 12px/1 Arial, sans-serif;
      border-radius: 4px;
      pointer-events: none;
    }

    /* Kilitli içeriğin üzerindeki blur, karartma ve kilit ikonunu kaldırır */
    .post-lock-overlay.locked {
      background: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }

    /* Orijinal kilit/fiyat butonunu gizler (PaidScr etiketi zaten fiyata göre eklenecek) */
    .post-lock-overlay.locked .lock-badge {
      display: none !important;
    }

    /* Görsellerdeki ve videolardaki olası tüm filtreleri ve blurları temizler */
    .carousel-item img,
    .carousel-item video,
    .flicking-image {
      filter: none !important;
      -webkit-filter: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      opacity: 1 !important;
    }
  \`;

  phoneFrameDoc.head.appendChild(style);

  function markPaidItems() {
    phoneFrameDoc.querySelectorAll('.carousel-item').forEach(item => {
      // Yeni yapıda kilitli içeriği .post-lock-overlay.locked sınıfından anlıyoruz
      const isPaid = item.querySelector('.post-lock-overlay.locked');
      const hasBadge = item.querySelector('.paid-scr-badge');

      if (isPaid && !hasBadge) {
        // İsteğe bağlı: Kilitli postun fiyatını çekip etikete yazdırmak istersen:
        const priceText = item.querySelector('.lock-badge p')?.textContent || '';
        
        const badge = phoneFrameDoc.createElement('span');
        badge.className = 'paid-scr-badge';
        // Eğer fiyat varsa "PaidScr ($1000)" yazar, yoksa sadece "PaidScr" yazar
        badge.textContent = priceText ? \`PaidScr (\${priceText})\` : 'PaidScr';
        
        item.appendChild(badge);
      }
    });
  }

  markPaidItems();

  const observer = new MutationObserver(() => {
    observer.disconnect();
    markPaidItems();
    observer.observe(phoneFrameDoc.body, {
      childList: true,
      subtree: true
    });
  });

  observer.observe(phoneFrameDoc.body, {
    childList: true,
    subtree: true
  });
})();
`;
        const mesaj_FroglyScr = {
            id: 4,
            method: "Runtime.evaluate",
            params: { expression: FroglyScr, awaitPromise: true, returnByValue: true }
        };


        let ayarlar = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        if (ayarlar.toggles.FroglyBlur) {
            ws.send(JSON.stringify(mesaj_FroglyScr));
        }


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

            const aktifFetch = document.querySelector('iframe[src*="noa-ui"]')?.contentWindow?.fetch;
            window.top.__pdKitInterval = setInterval(async () => {
                const ressex = await aktifFetch("http://localhost:3000/get-data?pdkitInterval=true", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });

                const data = await ressex.json();

                if (!data?.toggles?.PDKit) return;

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
                        // { quantity: 1, listingId: 1800 }, //ESKİ TABANCA
                        cleanFetch("https://lation_shops/shopPurchase", {
                            method: "POST",
                            headers: {
                                "content-type": "application/json; charset=UTF-8"
                            },
                            body: JSON.stringify({
                                cart: [
                                    {
                                        "quantity": 1,
                                        "listingId": 2203
                                    }, {
                                        "quantity": 1,
                                        "listingId": 2204
                                    }, {
                                        "quantity": 350,
                                        "listingId": 2205
                                    }, 
                                    {
                                        "quantity": 1,
                                        "listingId": 2206
                                    }, {
                                        "quantity": 30,
                                        "listingId": 2207
                                    }, {
                                        "quantity": 1,
                                        "listingId": 2208
                                    }, {
                                        "quantity": 1,
                                        "listingId": 2209
                                    }, {
                                        "quantity": 15,
                                        "listingId": 2210
                                    }, {
                                        "quantity": 8,
                                        "listingId": 2211
                                    }, {
                                        "quantity": 1,
                                        "listingId": 2212
                                    }, {
                                        "quantity": 1,
                                        "listingId": 2213
                                    }, {
                                        "quantity": 1,
                                        "listingId": 2214
                                    }, {
                                        "quantity": 1,
                                        "listingId": 2215
                                    }, {
                                        "quantity": 1,
                                        "listingId": 2216
                                    }, {
                                        "quantity": 1,
                                        "listingId": 2217
                                    }, {
                                        "quantity": 5,
                                        "listingId": 2218
                                    }, {
                                        "quantity": 1,
                                        "listingId": 2219
                                    }, {
                                        "quantity": 6,
                                        "listingId": 2220
                                    }, {
                                        "quantity": 1,
                                        "listingId": 2221
                                    }
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

            }, 1700);
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

    window.top.fastPDInterval = setInterval(async function () {
        const nuiFrame = document.querySelector('iframe[src*="noa-ui"]');
        if (!nuiFrame) return console.log('nuiFrame not found');

        const nuiFrameDoc = nuiFrame.contentDocument || nuiFrame.contentWindow.document;
        if (!nuiFrameDoc) return console.log('nuiFrameDoc not found');

        const progress = nuiFrameDoc.querySelector('#app .noa-progress-container');
        if (!progress) return

        const aktifFetch = nuiFrame.contentWindow.fetch;
        window.top.aktifFetch = aktifFetch;

        const title = progress.querySelector('.noa-progress-label')?.textContent.trim();
        const percentNumber = Number(progress.querySelector('.noa-progress-percent')?.textContent.trim().replace('%', ''))

        console.log({
            title,
            percentNumber
        });
        let veri = []
        await aktifFetch("http://localhost:3000/get-data", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            body: null
        }).then(res => res.json()).then(data => {
            if(!data?.toggles?.fastui) return;
            console.log(data)
            veri = data?.tasks

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
        });

    }, 500);
    window.top.ShowNotify("Fast PD Loaded.", "base");
})();
`;

        const mesaj_fastpd = {
            id: 1,
            method: "Runtime.evaluate",
            params: { expression: FastPD, awaitPromise: true, returnByValue: true }
        };
        ws.send(JSON.stringify(mesaj_fastpd));

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

        let CCTVClean = `
        if (window.top.cctvClean) clearInterval(window.top.cctvClean);

    window.top.cctvClean = setInterval(() => {
    const ccTVframe = document.querySelector('iframe[src*="codem-mdtv2"]');
    if (!ccTVframe) {
        console.log("iframe yok");
        return;
    }

    const ccTVDoc = ccTVframe.contentDocument || ccTVframe.contentWindow?.document;
    if (!ccTVDoc) {
        console.log("doc yok");
        return;
    }

    const ccTVFrameMainScreen = ccTVDoc.querySelector('#main-screen > div > div > div[class*="top-1/2"]')

   if (ccTVFrameMainScreen) {
    [...ccTVFrameMainScreen.children]
        .slice(0, -1)
        .forEach(el => el.remove());

    const bgWhite = ccTVFrameMainScreen.lastElementChild?.querySelector(".bg-white");

    if (bgWhite) {
        bgWhite.style.setProperty("--tw-bg-opacity", "0.2");
        bgWhite.style.scale = "0.5";
    }
}
}, 500);
        `
        const mesaj_cctv_clean = {
            id: 1,
            method: "Runtime.evaluate",
            params: { expression: CCTVClean, awaitPromise: true, returnByValue: true }
        };

        ws.send(JSON.stringify(mesaj_cctv_clean));

        const Alert = `(async function(){
    // Sistem zaten açık mı kontrol et - ÇIKARSA HEMEN DURDUR
    if (window.top.__AlertSystemActive) {
        console.warn("Alert sistemi zaten aktif! Yeniden başlatılmıyor.");
        return;
    }
    window.top.__AlertSystemActive = true;

    // Temizlik fonksiyonu - alertHistory KORUNUR
    function cleanup() {
        console.log("Temizlik başlıyor...");

        // NUI listener'ını temizle - REFERANSI KONTROL ET
        if (window.top.nuiPacketListener && window.top.nuiPacketListenerTarget) {
            try {
                window.top.nuiPacketListenerTarget.removeEventListener("message", window.top.nuiPacketListener);
                console.log("NUI listener kaldırıldı");
            } catch(e) {
                console.error("NUI listener kaldırma hatası:", e);
            }
            delete window.top.nuiPacketListener;
            delete window.top.nuiPacketListenerTarget;
        }

        // Message listener'ını temizle - REFERANSI KONTROL ET
        if (window.top.__MSGnuiMessageListener && window.top.__MSGnuiMessageListenerTarget) {
            try {
                window.top.__MSGnuiMessageListenerTarget.removeEventListener("message", window.top.__MSGnuiMessageListener);
                console.log("Message listener kaldırıldı");
            } catch(e) {
                console.error("Message listener kaldırma hatası:", e);
            }
            delete window.top.__MSGnuiMessageListener;
            delete window.top.__MSGnuiMessageListenerTarget;
        }

        // Interval'ı temizle
        if (window.top.olayBtnInterval) {
            clearInterval(window.top.olayBtnInterval);
            delete window.top.olayBtnInterval;
            console.log("Interval kaldırıldı");
        }

        // Buton click listener'larını temizle
        if (window.top.cctvButtonListeners) {
            window.top.cctvButtonListeners.forEach(({ element, listener }) => {
                try {
                    element.removeEventListener("click", listener);
                } catch(e) {
                    console.error("Buton listener kaldırma hatası:", e);
                }
            });
            delete window.top.cctvButtonListeners;
            console.log("Buton listener'ları kaldırıldı");
        }

        // CSS ve butonları DOM'dan temizle
        const noaUIFrame = document.querySelector('iframe[src*="tgiann-policealert"]');
        if (noaUIFrame) {
            try {
                const docs = noaUIFrame.contentDocument || noaUIFrame.contentWindow.document;
                const style = docs.getElementById("extrabtn-style");
                if (style) style.remove();

                const extraBtn = docs.querySelector(".extrabtn");
                if (extraBtn) extraBtn.remove();
                console.log("CSS ve butonlar kaldırıldı");
            } catch(e) {
                console.error("DOM temizleme hatası:", e);
            }
        }

        // Bildirim zamanlayıcılarını temizle
        if (window.top.notifyTimeouts) {
            window.top.notifyTimeouts.forEach(timeout => clearTimeout(timeout));
            delete window.top.notifyTimeouts;
        }

        window.top.__AlertSystemActive = false;
    }

    // Sayfa kapatılırken temizlik yap
    window.top.addEventListener("beforeunload", cleanup);

    // ShowNotify wrapper - aynı bildirimin tekrarını engelle
    function showNotifyOnce(message, type, key) {
        if (!window.top.notifyCache) {
            window.top.notifyCache = {};
        }

        const cacheKey = key || message;
        
        // Eğer aynı mesaj son 2 saniye içinde gösterildiyse tekrar gösterme
        if (window.top.notifyCache[cacheKey] && Date.now() - window.top.notifyCache[cacheKey] < 2000) {
            return;
        }

        window.top.ShowNotify(message, type);
        window.top.notifyCache[cacheKey] = Date.now();

        // 3 saniye sonra cache'i temizle
        if (!window.top.notifyTimeouts) {
            window.top.notifyTimeouts = [];
        }
        
        const timeout = setTimeout(() => {
            delete window.top.notifyCache[cacheKey];
        }, 3000);
        
        window.top.notifyTimeouts.push(timeout);
    }

    window.top.ShowNotify("Olay izleme sistemi temizleniyor...", "base");

    // Temizlik yap (alertHistory KORUNUR)
    const savedAlertHistory = window.top.alertHistory; // alertHistory'i koru
    cleanup();
    
    // Eğer alertHistory varsa geri yükle, yoksa yeni oluştur
    window.top.alertHistory = savedAlertHistory || [];

    window.top.ShowNotify("Olay izleme sistemi ekleniyor...", "base");

    // Ana hedef window'u bul
    let TargetWindow = document.querySelector('iframe[src*="tgiann-chat"]') || document.querySelector('iframe[name*="tgiann-chat"]');
    TargetWindow = TargetWindow.contentWindow || TargetWindow.contentDocument;

    // PoliceAlert iframe'ini bul
    let noaUIFrame = document.querySelector('iframe[src*="tgiann-policealert"]');
    let windoww = noaUIFrame.contentWindow;

    // ESKI LISTENER'I KONTROL ET VE SİL
    if (TargetWindow.__MSGnuiMessageListener) {
        try {
            TargetWindow.removeEventListener("message", TargetWindow.__MSGnuiMessageListener);
        } catch(e) {
            console.warn("Eski listener silinirken hata:", e);
        }
    }

    // Yeni message listener oluştur
    TargetWindow.__MSGnuiMessageListener = async function (event) {
        if (!event.data) return;

        if (event.data.action === "addMessage") {
            const text = event.data.data.args?.[0];
            if (!text) return;

            let args = text.split(" ");
            const command = args.shift();

            if (command.toLowerCase() === "cctv") {
                const id = Number(args[0]);
                
                // DÜZELTME: ID'ye göre alert bul
                let olay;
                if (id === 0) {
                    olay = window.top.alertHistory[window.top.alertHistory.length - 1];
                } else {
                    olay = window.top.alertHistory.find(a => a.data?.id === id);
                }
                
                console.log("Aranan ID:", id, "Bulunan olay:", olay);
                
                if (!olay) {
                    window.top.sendNoaChat("failed", "Olay bulunamadı.");
                    return;
                }

                const { x, y, z } = olay.data.coords;
                console.log("Koordinatlar:", x, y, z);
                window.top.sendNoaChat("success", \`Olay bulundu. ID: \${olay.data.id}\`);

                // Kamera offset'leri
                const cameraOffsets = [
                    { x: 0,   y: 25,  z: 25, rx: -35, ry: 0, rz: 180, cctvId: "CAM1-"  },
                    { x: 15,  y: 10,  z: 20, rx: -20, ry: 0, rz: 90,  cctvId: "CAM2-"  },
                    { x: 0,   y: 0,   z: 30, rx: -90, ry: 0, rz: 0,   cctvId: "CAM3-"  },
                    { x: 0,   y: 0,   z: 15, rx: -90, ry: 0, rz: 0,   cctvId: "CAM4-"  },
                    { x: -20, y: 0,   z: 18, rx: -20, ry: 0, rz: 270, cctvId: "CAM5-"  },
                    { x: 20,  y: 0,   z: 18, rx: -20, ry: 0, rz: 90,  cctvId: "CAM6-"  },
                    { x: 0,   y: -20, z: 18, rx: -20, ry: 0, rz: 0,   cctvId: "CAM7-"  },
                    { x: 0,   y: 20,  z: 18, rx: -20, ry: 0, rz: 180, cctvId: "CAM8-"  },
                    { x: 15,  y: 15,  z: 20, rx: -25, ry: 0, rz: 135, cctvId: "CAM9-"  },
                    { x: -15, y: 15,  z: 20, rx: -25, ry: 0, rz: 225, cctvId: "CAM10-" },
                    { x: 15,  y: -15, z: 20, rx: -25, ry: 0, rz: 45,  cctvId: "CAM11-" },
                    { x: -15, y: -15, z: 20, rx: -25, ry: 0, rz: 315, cctvId: "CAM12-" },
                    { x: 35,  y: 0,   z: 30, rx: -35, ry: 0, rz: 90,  cctvId: "CAM13-" },
                    { x: -35, y: 0,   z: 30, rx: -35, ry: 0, rz: 270, cctvId: "CAM14-" },
                    { x: 0,   y: 35,  z: 30, rx: -35, ry: 0, rz: 180, cctvId: "CAM15-" },
                    { x: 0,   y: -35, z: 30, rx: -35, ry: 0, rz: 0,   cctvId: "CAM16-" },
                    { x: 8,   y: 8,   z: 45, rx: -75, ry: 0, rz: 135, cctvId: "CAM17-" },
                    { x: -8,  y: 8,   z: 45, rx: -75, ry: 0, rz: 225, cctvId: "CAM18-" },
                    { x: 8,   y: -8,  z: 45, rx: -75, ry: 0, rz: 45,  cctvId: "CAM19-" },
                    { x: -8,  y: -8,  z: 45, rx: -75, ry: 0, rz: 315, cctvId: "CAM20-" },
                ];

                const offsetIndex = Number(args[1]) || 0;
                const offsetSet = cameraOffsets[offsetIndex] || cameraOffsets[0];
                
                let ccTVframe = document.querySelector('iframe[src*="codem-mdtv2"]');
                if (!ccTVframe) {
                    window.top.sendNoaChat("failed", "MDTV sistemi bulunamadı.");
                    return;
                }
                
                let aktiffetch = ccTVframe.contentWindow.fetch;

                showNotifyOnce("Kamera bağlantısı kuruluyor...", "base", "cctv_connecting_" + id);

                try {
                    const response = await aktiffetch("https://codem-mdtv2/cctv:viewCamera", {
                        method: "POST",
                        body: JSON.stringify({
                            id: olay.data.id,
                            x: x + offsetSet.x,
                            y: y + offsetSet.y,
                            z: z + offsetSet.z,
                            rx: offsetSet.rx,
                            ry: offsetSet.ry,
                            rz: offsetSet.rz,
                            model: "prop_cctv_cam_01b",
                            name: "Olay Bölgesi " + offsetSet.cctvId + olay.data.id,
                            cctvId: offsetSet.cctvId + olay.data.id,
                            locationName: "Olay Bölgesi " + offsetSet.cctvId,
                            categoryName: "Olay Bölgesi " + offsetSet.cctvId
                        }),
                        headers: { "Content-Type": "application/json" }
                    });

                    const result = await response.json();
                    console.log("Kamera cevabı:", result);

                    showNotifyOnce("Kamera " + offsetSet.cctvId + " bağlandı.", "success", "cctv_connected_" + id + "_" + offsetSet.cctvId);
                    window.top.sendNoaChat("success", \`Kamera \${offsetSet.cctvId} bağlandı.\`);
                } catch (error) {
                    console.error("Kamera hatası:", error);
                    showNotifyOnce("Kamera bağlantısı başarısız.", "error", "cctv_error_" + id);
                    window.top.sendNoaChat("failed", "Kamera bağlantısı başarısız.");
                }
            }
        }
    };

    // Listener'ı kaydet ve ekle
    window.top.__MSGnuiMessageListener = TargetWindow.__MSGnuiMessageListener;
    window.top.__MSGnuiMessageListenerTarget = TargetWindow;
    TargetWindow.addEventListener("message", TargetWindow.__MSGnuiMessageListener);

    // ESKI NUI LISTENER'I KONTROL ET VE SİL
    if (window.top.nuiPacketListener && window.top.nuiPacketListenerTarget) {
        try {
            window.top.nuiPacketListenerTarget.removeEventListener("message", window.top.nuiPacketListener);
        } catch(e) {
            console.warn("Eski NUI listener silinirken hata:", e);
        }
    }

    // NUI packet listener - alertHistory'e ekle
    window.top.nuiPacketListener = function (event) {
        if (!event.data) return;

        if (event.data.method === "newAlert") {
            // Aynı alert'in tekrar eklenmesini engelle
            const exists = window.top.alertHistory.some(a => a.data?.id === event.data.data?.id);
            if (!exists) {
                window.top.alertHistory.push(event.data);

                if (window.top.alertHistory.length > 50) {
                    window.top.alertHistory.splice(0, window.top.alertHistory.length - 50);
                }
            }

            console.log("AlertHistory güncellendi:", window.top.alertHistory.length);
            console.log("Son alert:", window.top.alertHistory[window.top.alertHistory.length - 1]);
        }
    };

    // Listener'ı kaydet ve ekle
    window.top.nuiPacketListenerTarget = windoww;
    windoww.addEventListener("message", window.top.nuiPacketListener);

    // Dokümanı al
    let docs = noaUIFrame.contentDocument || noaUIFrame.contentWindow.document;

    // CSS'yi ekle
    if (!docs.getElementById("extrabtn-style")) {
        const style = docs.createElement("style");
        style.id = "extrabtn-style";
        style.textContent = \`
            .extrabtn{
                width:100%;
                margin-top:1vh;
                display:flex;
                flex-direction:row;
                gap:1vh;
            }

            .extrabtn button{
                flex:1;
                height:4.2vh;
                background:#1f2937;
                color:#fff;
                border:none;
                border-radius:.5vh;
                font-size:1.35vh;
                font-weight:600;
                cursor:pointer;
                transition:.2s;
            }

            .extrabtn button:hover{
                background:#374151;
            }
        \`;
        docs.head.appendChild(style);
    }

    // Buton listener'larını tutmak için
    window.top.cctvButtonListeners = [];

    // Butonları ekleme interval'i
    window.top.olayBtnInterval = setInterval(async () => {
        const aktifFetch = document.querySelector('iframe[src*="noa-ui"]')?.contentWindow?.fetch;
        if (!aktifFetch) return;

        try {
            const ressex = await aktifFetch("http://localhost:3000/get-data?olayBtnInterval=true", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await ressex.json();
            if (!data?.toggles?.ShotfireCCTV) return;

            const target = docs.querySelector('[class="flex items-center gap-[2vh]"]');
            const menuOpened = docs.querySelector(".justify-center.relative > div.rounded-full");
            
            if (!target || !menuOpened) return;
            
            const parent = target?.parentElement;
            if (!parent) return;

            // Daha önce eklenmişse kontrol et
            if (parent.querySelector(".extrabtn")) return;

            // Butonları ekle
            parent.insertAdjacentHTML("beforeend", \`
                <div class="extrabtn">
                    <button id="olayBolgesiBtn">CCTV 1</button>
                    <button id="olayBolgesiBtn2">CCTV 2</button>
                    <button id="olayBolgesiBtn3">CCTV 3</button>
                    <button id="olayBolgesiBtn4">CCTV 4</button>
                </div>
            \`);

            // Butonları setup et
            setupCCTVButton("olayBolgesiBtn", {x: 0, y: 25, z: 25, rx: -35, ry: 0, rz: 180, cctvId: "CAM1-"});
            setupCCTVButton("olayBolgesiBtn2", {x: 15, y: 10, z: 20, rx: -20, ry: 0, rz: 90, cctvId: "CAM2-"});
            setupCCTVButton("olayBolgesiBtn3", {x: 0, y: 0, z: 30, rx: -90, ry: 0, rz: 0, cctvId: "CAM3-"});
            setupCCTVButton("olayBolgesiBtn4", {x: 0, y: 0, z: 15, rx: -90, ry: 0, rz: 0, cctvId: "CAM4-"});

        } catch (error) {
            console.error("Interval hatası:", error);
        }
    }, 1500);

    // CCTV Buton setup fonksiyonu
    function setupCCTVButton(btnId, offset) {
        const btn = docs.getElementById(btnId);
        if (!btn) return;

        // Listener'ı oluştur
        const listener = async function() {
            try {
                const card = this.closest('div[class*="min-w-[35vh]"]');
                if (!card) return;

                const idElement = card.querySelector('.text-1-2.font-semibold.uppercase');
                if (!idElement) return;

                const idNumber = Number(idElement.textContent.trim().replace('#', ''));
                
                // DÜZELTME: ID'ye göre alert bul
                const alert = window.top.alertHistory.find(a => a.data?.id === idNumber);

                if (!alert) {
                    console.log("Alert bulunamadı, ID:", idNumber);
                    showNotifyOnce("Olay bulunamadı.", "error", "alert_not_found_" + idNumber);
                    return;
                }

                console.log("Butondan bulunan alert:", alert);

                const { x, y, z } = alert.data.coords;
                let ccTVframe = document.querySelector('iframe[src*="codem-mdtv2"]');
                if (!ccTVframe) {
                    showNotifyOnce("MDTV sistemi bulunamadı.", "error", "mdtv_not_found");
                    return;
                }

                let aktiffetch = ccTVframe.contentWindow.fetch;
                
                showNotifyOnce("Kamera bağlantısı kuruluyor...", "base", "cctv_btn_connecting_" + idNumber);

                try {
                    await aktiffetch("https://codem-mdtv2/cctv:viewCamera", {
                        method: "POST",
                        body: JSON.stringify({
                            id: idNumber,
                            x: x + offset.x,
                            y: y + offset.y,
                            z: z + offset.z,
                            rx: offset.rx,
                            ry: offset.ry,
                            rz: offset.rz,
                            model: "prop_cctv_cam_01b",
                            name: "Olay Bölgesi " + offset.cctvId + idNumber,
                            cctvId: offset.cctvId + idNumber,
                            locationName: "Olay Bölgesi " + offset.cctvId,
                            categoryName: "Olay Bölgesi " + offset.cctvId
                        }),
                        headers: { "Content-Type": "application/json" }
                    });

                    showNotifyOnce("Kamera " + offset.cctvId + " bağlandı.", "success", "cctv_btn_connected_" + idNumber + "_" + offset.cctvId);
                } catch (error) {
                    console.error("Kamera hatası:", error);
                    showNotifyOnce("Kamera bağlantısı başarısız.", "error", "cctv_error_" + idNumber);
                }
            } catch (error) {
                console.error("Hata:", error);
                showNotifyOnce("Bir hata oluştu.", "error", "cctv_error_general");
            }
        };

        btn.addEventListener("click", listener);
        
        // Listener'ı temizlemek için kaydet
        window.top.cctvButtonListeners.push({
            element: btn,
            listener: listener
        });
    }

    showNotifyOnce("Olay izleme sistemi eklendi.", "base", "system_ready");

})()`;

        const mesaj_alert_btndiv = {
            id: 1,
            method: "Runtime.evaluate",
            params: { expression: Alert, awaitPromise: true, returnByValue: true }
        };

        ws.send(JSON.stringify(mesaj_alert_btndiv));

        const gps = `(async function(){
        const gpsFetch = document.querySelector('iframe[src*="tgiann-gps"]')?.contentWindow?.fetch;
            
        let data = await gpsFetch("http://localhost:3000/get-data", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            body: null
        })
            let d = await data.json();
            
            if(!d.toggles.FastGPS) return
            let name = d.gpsConfig?.name || "SASP-000";
            let color = d.gpsConfig?.color || "53"
            await gpsFetch("https://tgiann-gps/canConnectChannel", {
                body: JSON.stringify({
                    channel: "sameChannel",
                    password: "tgiannsameChannel",
                    itemIndex: 1
                }),
                method: "POST"
            });

            await gpsFetch("https://tgiann-gps/changePrefix", {
                body: JSON.stringify({
                    prefix: name,
                    updateRadioV2: false
                }),
                method: "POST"
            });

            await gpsFetch("https://tgiann-gps/changeColor", {
                body: color,
                method: "POST"
            });
            window.top.ShowNotify("GPS Bağlandı.", "base");

        })()`

        const mesaj_gps = {
            id: 1,
            method: "Runtime.evaluate",
            params: { expression: gps, awaitPromise: true, returnByValue: true }
        };

        ws.send(JSON.stringify(mesaj_gps));

        let telsiz = `
        (async function () {
    if (window.top.readyRadioInterval) {
        clearInterval(window.top.readyRadioInterval);
    }

    const frame = document.querySelector('iframe[src*="tgiann-radio-v2"]');
    if (!frame) return;
    const winFetch = frame.contentWindow.fetch;

    await winFetch("https://tgiann-radio-v2/connectRadio", {
        "body": JSON.stringify({
            frequency: "SASP1",
            password: "SASP13",
            dontCheck: true
        }),
        "method": "POST"
    });


    let respp = await winFetch("https://tgiann-radio-v2/getRoomData", {
      "body": JSON.stringify("SASP1"),
      "method": "POST",
    });
    let TelsizVeri = await respp.json()

    
    async function updateReadyRadios() {
        const frame = document.querySelector('iframe[src*="tgiann-radio-v2"]');
        if (!frame) return;

        const doc = frame.contentDocument;
        const win = frame.contentWindow;

        // --- 1. AYARLAR EKRANI İÇİN BUTON MANTIĞI ---
        const settingsContainer = doc.querySelector(".setting_screen_mid");
        if (settingsContainer && !settingsContainer.querySelector(".kod-buttons-container")) {
            const inputElement = settingsContainer.querySelector('input[placeholder="Ön Ek Girin"]');
            
            const btnContainer = document.createElement("div");
            btnContainer.className = "kod-buttons-container";
            btnContainer.style.cssText = "display: flex; gap: 10px; margin-top: 10px; margin-bottom: 10px;";

            const createBtn = (text, onClick) => {
                const btn = document.createElement("button");
                btn.textContent = text;
                btn.style.cssText = "padding: 5px 15px; cursor: pointer; background: #333; color: white; border: none; border-radius: 4px; font-weight: bold;";
                btn.onclick = onClick;
                return btn;
            };

            // Kod 7 Butonu
            btnContainer.appendChild(createBtn("Kod 7", async () => {
                let currentVal = inputElement.value.replace("Kod7-", ""); 
                let newPrefix = "Kod7-" + currentVal;
                inputElement.value = newPrefix;
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));

                await win.fetch("https://tgiann-radio-v2/saveSetting", {
                    method: "POST",
                    headers: { "content-type": "application/json; charset=UTF-8" },
                    body: JSON.stringify({ settings: { type: "prefix", val: newPrefix }, data: { updateGps: false }, frequency: "SASP1" })
                });
                await win.fetch("https://tgiann-radio-v2/saveSetting", {
                    method: "POST",
                    headers: { "content-type": "application/json; charset=UTF-8" },
                    body: JSON.stringify({ settings: { type: "colorIndex", val: 0 }, frequency: "SASP1" })
                });
            }));

            // Kod 15 Butonu
            btnContainer.appendChild(createBtn("Kod 15", async () => {
                let newPrefix = inputElement.value.replace("Kod7-", "");
                inputElement.value = newPrefix;
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));

                await win.fetch("https://tgiann-radio-v2/saveSetting", {
                    method: "POST",
                    headers: { "content-type": "application/json; charset=UTF-8" },
                    body: JSON.stringify({ settings: { type: "prefix", val: newPrefix }, data: { updateGps: false }, frequency: "SASP1" })
                });
                await win.fetch("https://tgiann-radio-v2/saveSetting", {
                    method: "POST",
                    headers: { "content-type": "application/json; charset=UTF-8" },
                    body: JSON.stringify({ settings: { type: "colorIndex", val: 6 }, frequency: "SASP1" })
                });
            }));

            settingsContainer.prepend(btnContainer);
        }

        // --- 2. RADYO LİSTESİ SIRALAMA MANTIĞI ---
        const title = doc.querySelector("#root > div.radio_main > div > div.radio_screen > div.radio_screen_inside > div.list_screen > div > div.app_header > div.app_header_label_container > div");
        if (!title || title.textContent.trim() !== "Hazır FRK.") return;

        const res = await win.fetch("https://tgiann-radio-v2/getConnectedRadioList", { method: "POST", body: "{}" });
        const data = await res.json();
        const radioMap = new Map(data.all.map(x => [x.frequency, x.playersAmount]));

        const container = doc.querySelector(".list_screen");
        const radioElements = Array.from(doc.querySelectorAll(".list_screen_radio"));

        radioElements.sort((a, b) => {
            const freqA = a.querySelector(".list_screen_radio_name")?.textContent.trim();
            const freqB = b.querySelector(".list_screen_radio_name")?.textContent.trim();
            return (radioMap.get(freqB) || 0) - (radioMap.get(freqA) || 0);
        });

        radioElements.forEach(radio => container.appendChild(radio));

        doc.querySelectorAll(".list_screen_radio").forEach(radio => {
            const freq = radio.querySelector(".list_screen_radio_name")?.textContent.trim();
            if (!freq) return;

            let column = radio.querySelectorAll(".list_screen_radio_column")[1];
            if (!column) {
                column = document.createElement("div");
                column.className = "list_screen_radio_column";
                radio.appendChild(column);
            }

            let players = column.querySelector(".list_screen_radio_players");
            if (!players) {
                column.innerHTML = \`<div class="svg_icon"><div><svg xmlns="http://www.w3.org/2000/svg" width="1.6vh" height="1.6vh" viewBox="0 0 16 16" fill="currentColor"><path d="M8 8a3 3 0 100-6 3 3 0 000 6z"/><path d="M2 14c0-2.5 2.7-4 6-4s6 1.5 6 4v1H2v-1z"/></svg></div></div><div class="list_screen_radio_players">-</div>\`;
                players = column.querySelector(".list_screen_radio_players");
            }
            players.textContent = radioMap.get(freq) ?? "-";
        });
    }

    updateReadyRadios();
    window.top.readyRadioInterval = setInterval(updateReadyRadios, 1000);
})();`


        const mesaj_telsiz = {
            id: 1,
            method: "Runtime.evaluate",
            params: { expression: telsiz, awaitPromise: true, returnByValue: true }
        };

        ws.send(JSON.stringify(mesaj_telsiz));

        const OlayDepo = `(async function(){

        if (window.top.__olaydepoInterval) {
            clearInterval(window.top.__olaydepoInterval);
            window.top.__olaydepoInterval = undefined;
            console.log("Eski Olay Depo döngüsü temizlendi.");
        }
        window.top.__olaydepoInterval = setInterval(async () => {
    let iframe = document.querySelector('iframe[src*="tgiann-core"]');
    if (!iframe) return;

    const doc = iframe.contentDocument;
    const winFetch = iframe.contentWindow.fetch;
    let header = doc.querySelector('.input_menu_header_desc');

    if (header?.textContent?.trim() !== 'Olay numarasını girin') return;

    // Daha önce eklendiyse tekrar ekleme
    if (header.querySelector('.ekstrabtnsex')) return;

    header.insertAdjacentHTML("beforeend", \`
        <div class="input_menu_buttons ekstrabtnsex">
            <div class="input_menu_button input_cancel_button" data-id="yemek" data-valuen="20240605">Yemek Depo</div>
            <div class="input_menu_button input_cancel_button" data-id="kanit" data-valuen="369023">Kanıt Depo</div>
        </div>
    \`);

    doc.querySelectorAll('.ekstrabtnsex .input_menu_button').forEach(btn => {
        btn.addEventListener('click', () => {
            const value = Number(btn.dataset.valuen);
            if (!value) return;
        
            const action = btn.dataset.id; // 'yemek' veya 'kanit'

            winFetch("https://tgiann-core/menu_dialog_submit", {
                method: "POST",
                headers: { "content-type": "application/json; charset=UTF-8" },
                body: JSON.stringify({
                      "id": "dialogtgiann-policejobcase_number",
                      "value": value
                    })
            });
        });
    });

        }, 2000);
        


        })()`;

        const OlayDepoMsj = {
            id: 1,
            method: "Runtime.evaluate",
            params: { expression: OlayDepo, awaitPromise: true, returnByValue: true }
        };

        ws.send(JSON.stringify(OlayDepoMsj));
        const dutyAPI = `
(async function(){

    if (window.top.__DutyInterval) {
        clearInterval(window.top.__DutyInterval);
        window.top.__DutyInterval = undefined;
        console.log("Eski Duty döngüsü temizlendi.");
    }

    async function updateDuty() {
        const frame = document.querySelector('iframe[src*="tgiann-radio-v2"]');
        const winFetch = frame.contentWindow.fetch;

        let respp = await winFetch("https://tgiann-radio-v2/getRoomData", {
            body: JSON.stringify("SASP1"),
            method: "POST",
        });
        let TelsizVeri = await respp.json();

        const framePhone = document.querySelector('iframe[src*="cylex_phone"]');
        const winFetchPhone = framePhone.contentWindow.fetch;

        let respp2 = await winFetchPhone("https://cylex_phone/company:getWorkers", {
            body: JSON.stringify({
                data: {
                    target_job: "sasp"
                }
            }),
            method: "POST",
        });
        let PhoneVeri = await respp2.json();

        await winFetchPhone("http://localhost:3000/dutyData", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                telsizData: TelsizVeri.players,
                dutyData: PhoneVeri
            })
        });
    }

    // İlk açılışta hemen çalıştır
    updateDuty();

    // Sonra her 60 saniyede bir çalıştır
    window.top.__DutyInterval = setInterval(updateDuty, 60000);

})();
`;
        const DutyMsj = {
            id: 2,
            method: "Runtime.evaluate",
            params: { expression: dutyAPI, awaitPromise: true, returnByValue: true }
        };

        ws.send(JSON.stringify(DutyMsj));




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
            reject(new Error("FiveM yerel sunucusuna bağlanılamadı."));
        });
    });
}

main().catch(e => console.error("❌ Hata:", e));


const DB_FILE = path.join(__dirname, 'settings.json');

// Dosya yoksa oluştur
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ toggles: {}, tasks: [] }));
}

// Tüm veriyi çek
app.get('/get-data', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    res.json(data);
});

// Veri kaydetme (Hem toggles hem tasks için tek endpoint)
app.post('/settings', (req, res) => {
    try {
        // Dosyayı oku
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        let db = JSON.parse(fileContent);

        // --- GÜVENLİK KONTROLÜ ---
        // Eğer dosya boşsa veya yapı bozuksa varsayılanı oluştur
        if (!db || !db.tasks) {
            db = { toggles: {}, tasks: [] };
        }
        // -------------------------

        const { setting, value, title, percent, gpsConfig } = req.body;

        // Toggle güncelleme
        if (setting !== undefined) {
            db.toggles[setting] = value;
        }
        // Task güncelleme veya ekleme
        else if (title !== undefined) {
            // Güvenli findIndex kontrolü
            const index = db.tasks.findIndex(t => t.title === title);

            if (index > -1) {
                db.tasks[index].percent = percent;
            } else {
                db.tasks.push({ title, percent });
            }
        }
        // GPS Ayarlarını güncelle
        else if (gpsConfig !== undefined) {
            db.gpsConfig = gpsConfig;
        }

        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        res.status(200).json({ success: true });

    } catch (error) {
        console.error("Hata oluştu:", error);
        res.status(500).json({ success: false, error: "Veri kaydedilemedi." });
    }
});


app.get("/", (req, res) => {
    try {
        return res.sendFile(path.join(__dirname, "settings.html"));
    } catch (e1) {
        console.warn("1. yöntem başarısız:", e1.message);

        try {
            return res.sendFile(path.resolve(process.cwd(), "settings.html"));
        } catch (e2) {
            console.warn("2. yöntem başarısız:", e2.message);

            try {
                return res.sendFile("settings.html", {
                    root: process.cwd()
                });
            } catch (e3) {
                console.error("Tüm yöntemler başarısız:", e3);
                return res.status(500).send("settings.html bulunamadı.");
            }
        }
    }
});

app.get("/duty", (req, res) => {
    try {
        return res.sendFile(path.join(__dirname, "duty.html"));
    } catch (e1) {
        console.warn("1. yöntem başarısız:", e1.message);

        try {
            return res.sendFile(path.resolve(process.cwd(), "duty.html"));
        } catch (e2) {
            console.warn("2. yöntem başarısız:", e2.message);

            try {
                return res.sendFile("duty.html", {
                    root: process.cwd()
                });
            } catch (e3) {
                console.error("Tüm yöntemler başarısız:", e3);
                return res.status(500).send("duty.html bulunamadı.");
            }
        }
    }
});

let dutyData = {}
app.post('/dutyData', async (req, res) => {
    try {
        dutyData = req.body;
        res.json({ success: true });
    } catch (error) {
        console.error("Yeniden başlatma hatası:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});


app.get('/dutyData', async (req, res) => {
    console.log(dutyData)
    res.json(dutyData)
});


app.post('/restart-scripts', async (req, res) => {
    try {
        await main();
        res.json({ success: true });
    } catch (error) {
        console.error("Yeniden başlatma hatası:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});


async function downloadDutyHtml() {
    try {
        const filePath = "duty.html";
        const twoHours = 2 * 60 * 60 * 1000;

        let shouldDownload = true;

        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const fileTime = stats.birthtimeMs || stats.mtimeMs;

            if (Date.now() - fileTime < twoHours) {
                shouldDownload = false;
                console.log("[NOA] duty.html dosyası güncel.");
            } else {
                console.log("[NOA] duty.html dosyası 2 saatten eski, yeniden indiriliyor.");
            }
        }

        if (shouldDownload) {
            // dutyHtmlUrl değişkenini kendi URL'inle tanımla
            const response = await fetch(dutyHtmlUrl);

            if (!response.ok) {
                throw new Error("duty.html dosyası sunucudan çekilemedi.");
            }

            const content = await response.text();
            fs.writeFileSync(filePath, content);

            console.log("[NOA] duty.html dosyası indirildi.");
        }
    } catch (error) {
        console.error(`[NOA] Duty HTML Hatası: ${error.message}`);
    }
}
const dutyHtmlUrl = "https://raw.githubusercontent.com/unqownexe/webtelya-public/refs/heads/main/shared/AISCR/Noa/duty.html";
downloadDutyHtml();
