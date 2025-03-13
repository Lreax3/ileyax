const { ipcRenderer } = require('electron');

const searchButton = document.getElementById('searchBtn');
const productNameInput = document.getElementById('productName');
const resultsDiv = document.getElementById('results');

window.electron.searchBestPrice('Under Armour UA W Charged Pursuit 3 BL Spor AyakkabıKadın')
    .then(result => {
        console.log('En düşük fiyat:', result.bestPrice);
        console.log('En düşük fiyatlı ürünün linki:', result.bestPriceLink);
        console.log('En düşük fiyatın bulunduğu site:', result.bestPriceSite);
    })
    .catch(error => console.error('Hata:', error));


searchButton.addEventListener('click', () => {
  const productName = productNameInput.value;

  if (productName) {
    ipcRenderer.send('search-product', productName);  // Ana işleme mesaj gönder
    resultsDiv.innerHTML = 'Arama yapılıyor...';
  } else {
    resultsDiv.innerHTML = 'Lütfen geçerli bir ürün adı girin.';
  }
});

ipcRenderer.on('search-results', (event, results) => {
  resultsDiv.innerHTML = results || 'Sonuç bulunamadı.';
});
