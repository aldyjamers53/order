// =======================================================
// CONFIGURATION INTEGRASI DATA
// =======================================================
const WA_ADMIN_NUMBER = "6281556828324"; // Nomor WA Admin Anda sudah aktif di sini

// Integrasi Akun EmailJS Anda
// Silakan buat akun gratis di emailjs.com untuk mendapatkan kredensial di bawah ini
(function() {
    emailjs.init("USER_PUBLIC_KEY_ANDA"); // Jalankan inisialisasi dengan Public Key Anda
})();

const EMAILJS_SERVICE_ID = "SERVICE_ID_ANDA"; // Masukkan Service ID EmailJS Anda
const EMAILJS_TEMPLATE_ID = "TEMPLATE_ID_ANDA"; // Masukkan Template ID EmailJS Anda
// =======================================================


// Inisialisasi Elemen DOM Utama
const form = document.getElementById('orderForm');
const selectProv = document.getElementById('provinsi');
const selectKab = document.getElementById('kabupaten');
const selectKec = document.getElementById('kecamatan');
const selectKel = document.getElementById('kelurahan');

// Elemen Status Loading saat API memuat data
const loadProv = document.getElementById('loadProv');
const loadKab = document.getElementById('loadKab');
const loadKec = document.getElementById('loadKec');
const loadKel = document.getElementById('loadKel');


// --- 1. PROSES AJAX AMBIL DATA API WILAYAH EMSIFA ---

// Ambil Data Provinsi Pertama Kali
async function fetchProvinsi() {
    loadProv.style.display = 'block';
    try {
        const response = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        const data = await response.json();
        data.forEach(prov => {
            let opt = document.createElement('option');
            opt.value = prov.id;
            opt.text = prov.name;
            selectProv.add(opt);
        });
    } catch (error) {
        console.error("Gagal memuat provinsi:", error);
    } finally {
        loadProv.style.display = 'none';
    }
}
fetchProvinsi();

// Logika Bertingkat: Jika Provinsi Diubah -> Load Kabupaten
selectProv.addEventListener('change', async function() {
    resetSelect(selectKab, '-- Pilih Kabupaten/Kota --');
    resetSelect(selectKec, '-- Pilih Kecamatan --');
    resetSelect(selectKel, '-- Pilih Desa/Kelurahan --');
    
    if(!this.value) return;
    
    loadKab.style.display = 'block';
    try {
        const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${this.value}.json`);
        const data = await response.json();
        selectKab.disabled = false;
        data.forEach(kab => {
            let opt = document.createElement('option');
            opt.value = kab.id;
            opt.text = kab.name;
            selectKab.add(opt);
        });
    } catch (error) {
        console.error("Gagal memuat kabupaten:", error);
    } finally {
        loadKab.style.display = 'none';
    }
});

// Logika Bertingkat: Jika Kabupaten Diubah -> Load Kecamatan
selectKab.addEventListener('change', async function() {
    resetSelect(selectKec, '-- Pilih Kecamatan --');
    resetSelect(selectKel, '-- Pilih Desa/Kelurahan --');
    
    if(!this.value) return;
    
    loadKec.style.display = 'block';
    try {
        const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${this.value}.json`);
        const data = await response.json();
        selectKec.disabled = false;
        data.forEach(kec => {
            let opt = document.createElement('option');
            opt.value = kec.id;
            opt.text = kec.name;
            selectKec.add(opt);
        });
    } catch (error) {
        console.error("Gagal memuat kecamatan:", error);
    } finally {
        loadKec.style.display = 'none';
    }
});

// Logika Bertingkat: Jika Kecamatan Diubah -> Load Kelurahan/Desa
selectKec.addEventListener('change', async function() {
    resetSelect(selectKel, '-- Pilih Desa/Kelurahan --');
    
    if(!this.value) return;
    
    loadKel.style.display = 'block';
    try {
        const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${this.value}.json`);
        const data = await response.json();
        selectKel.disabled = false;
        data.forEach(kel => {
            let opt = document.createElement('option');
            opt.value = kel.id;
            opt.text = kel.name;
            selectKel.add(opt);
        });
    } catch (error) {
        console.error("Gagal memuat kelurahan:", error);
    } finally {
        loadKel.style.display = 'none';
    }
});

// Helper untuk membersihkan dropdown turunan
function resetSelect(element, defaultText) {
    element.innerHTML = `<option value="">${defaultText}</option>`;
    element.disabled = true;
}


// --- 2. VALIDASI FORM INPUT SECARA KETAT ---

form.addEventListener('submit', function(e) {
    e.preventDefault();
    let isValid = true;

    // List Field yang Wajib Diisi (Mandatori)
    const reqInputs = [
        { id: 'namaLengkap' },
        { id: 'provinsi' },
        { id: 'kabupaten' },
        { id: 'kecamatan' },
        { id: 'kelurahan' },
        { id: 'kodePos' },
        { id: 'alamatLengkap' },
        { id: 'jumlahPesanan' },
        { id: 'kurir' }
    ];

    reqInputs.forEach(inputObj => {
        const el = document.getElementById(inputObj.id);
        const errEl = el.nextElementSibling && el.nextElementSibling.classList.contains('error-message') ? el.nextElementSibling : el.parentElement.querySelector('.error-message');
        
        if (!el.value.trim()) {
            el.classList.add('error');
            if(errEl) errEl.style.display = 'block';
            isValid = false;
        } else {
            el.classList.remove('error');
            if(errEl) errEl.style.display = 'none';
        }
    });

    // Validasi Pola WhatsApp Khusus Indonesia (08xxx / 628xxx) minimal 10 digit
    const waInput = document.getElementById('whatsapp');
    const waErr = waInput.nextElementSibling;
    const waRegex = /^(08|628)[0-9]{8,11}$/;
    if (!waRegex.test(waInput.value.trim())) {
        waInput.classList.add('error');
        waErr.style.display = 'block';
        isValid = false;
    } else {
        waInput.classList.remove('error');
        waErr.style.display = 'none';
    }

    // Validasi Format Email Opsional (Hanya divalidasi jika diisi oleh pembeli)
    const emailInput = document.getElementById('email');
    const emailErr = emailInput.nextElementSibling;
    if (emailInput.value.trim() !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
            emailInput.classList.add('error');
            emailErr.style.display = 'block';
            isValid = false;
        } else {
            emailInput.classList.remove('error');
            emailErr.style.display = 'none';
        }
    } else {
        emailInput.classList.remove('error');
        emailErr.style.display = 'none';
    }

    // Validasi Checkbox Pernyataan Benar Alamat
    const agreeCheck = document.getElementById('persetujuan');
    const agreeErr = document.getElementById('agreeError');
    if (!agreeCheck.checked) {
        agreeErr.style.display = 'block';
        isValid = false;
    } else {
        agreeErr.style.display = 'none';
    }

    // Jika seluruh sistem validasi lolos, kirim data ke sistem pusat
    if (isValid) {
        kirimData();
    } else {
        // Efek Fokus Otomatis Bergulir ke bagian form yang error pertama kali
        const firstError = document.querySelector('.error, #agreeError[style*="display: block"]');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
});


// --- 3. PROSES PENGIRIMAN DATA (EMAILJS & REDIRECT VIA SPA) ---

function kirimData() {
    const btnKirim = document.getElementById('btnKirim');
    const btnText = document.getElementById('btnText');
    
    // Aktifkan animasi loading pada tombol submit
    btnKirim.disabled = true;
    btnText.innerHTML = `<i class="fa-solid fa-spinner spinner"></i> Memproses Pesanan...`;

    // Ambil nilai teks murni dari dropdown wilayah yang sedang terpilih
    const provText = selectProv.options[selectProv.selectedIndex].text;
    const kabText = selectKab.options[selectKab.selectedIndex].text;
    const kecText = selectKec.options[selectKec.selectedIndex].text;
    const kelText = selectKel.options[selectKel.selectedIndex].text;
    
    // Format Waktu Berdasarkan Waktu Lokal Sistem Pengguna
    const opsiTanggal = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' };
    const tanggalSekarang = new Date().toLocaleDateString('id-ID', opsiTanggal);

    // Kumpulan Parameter Objek yang akan dilempar ke EmailJS
    const templateParams = {
        nama: document.getElementById('namaLengkap').value,
        wa: document.getElementById('whatsapp').value,
        produk: document.getElementById('prodName').innerText,
        jumlah: document.getElementById('jumlahPesanan').value,
        kurir: document.getElementById('kurir').value,
        provinsi: provText,
        kota: kabText,
        kecamatan: kecText,
        desa: kelText,
        alamat: document.getElementById('alamatLengkap').value,
        kodepos: document.getElementById('kodePos').value,
        patokan: document.getElementById('patokan').value || '-',
        catatan: document.getElementById('catatan').value || '-',
        tanggal: tanggalSekarang
            };

    // Eksekusi API EmailJS untuk Mengirim Email ke Admin
    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
        .then(function(response) {
            console.log('EMAIL BERHASIL DIKIRIM!', response.status, response.text);
            tampilkanHalamanSukses(templateParams);
        }, function(error) {
            console.error('GAGAL MENGIRIM EMAIL...', error);
            // Tetap diarahkan ke halaman sukses agar pengalaman pengguna (UX) pembeli tidak terganggu masalah konfigurasi
            tampilkanHalamanSukses(templateParams);
        });
}

// --- 4. TAMPILKAN HALAMAN SUKSES & GENERATE ACTION BUTTON WA ---

function tampilkanHalamanSukses(data) {
    // Navigasi SPA murni (Sembunyikan Halaman Form Checkout, Munculkan Layar Sukses)
    document.getElementById('checkoutPage').classList.remove('active');
    document.getElementById('successPage').classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Format Teks String Sesuai Kebutuhan Order Baru untuk Dikirim Melalui WhatsApp API
    const teksWa = `ORDER BARU\n\n` +
                   `Nama : ${data.nama}\n` +
                   `WA : ${data.wa}\n\n` +
                   `Produk : ${data.produk}\n` +
                   `Jumlah Pesanan : ${data.jumlah}\n\n` +
                   `Kurir : ${data.kurir}\n\n` +
                   `Provinsi : ${data.provinsi}\n` +
                   `Kota : ${data.kota}\n` +
                   `Kecamatan : ${data.kecamatan}\n` +
                   `Desa : ${data.desa}\n\n` +
                   `Alamat :\n${data.alamat}\n\n` +
                   `Kode Pos :\n${data.kodepos}\n\n` +
                   `Patokan :\n${data.patokan}\n\n` +
                   `Catatan :\n${data.catatan}\n\n` +
                   `Tanggal : ${data.tanggal}`;

    // Menghubungkan Tautan API WhatsApp pada Tombol Hubungi WhatsApp Admin di Layar Akhir
    const linkWaAdmin = `https://api.whatsapp.com/send?phone=${WA_ADMIN_NUMBER}&text=${encodeURIComponent(teksWa)}`;
    document.getElementById('btnWaAdmin').href = linkWaAdmin;
}