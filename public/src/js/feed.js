
var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');

function openCreatePostModal() {
  createPostArea.style.display = 'block';

  if('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.map(sw => {
        sw.unregister();
      })
    })
  }
}

function closeCreatePostModal() {
  createPostArea.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);
// Currently Not In Use 
function handleSaveButton(e) {
  if('caches' in window) {
    caches.open('user-requested')
     .then(cache => {
       cache.add('https://httpbin.org/get')
       cache.add('/src/images/sf-boat.jpg')
     });
  }
}

function createCard(data) {
  console.log('data to  ui ', data);
  var cardWrapper = document.createElement('div');
  var cardTitle = document.createElement('div');
  var cardTitleTextElement = document.createElement('h2');
  var cardSupportingText = document.createElement('div');
  // var cardSaveButton = document.createElement('button');

  // cardSaveButton.textContent = 'save';
  // cardSaveButton.addEventListener('click', handleSaveButton);

  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  cardWrapper.style.margin = '0 auto';

  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image + ')';
  cardTitle.style.backgroundSize = 'cover';
  cardTitle.style.height = '180px';

  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;

  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  cardSupportingText.style.color = 'black';


  // cardSupportingText.appendChild(cardSaveButton);

  cardTitle.appendChild(cardTitleTextElement);

  cardWrapper.appendChild(cardTitle);
  cardWrapper.appendChild(cardSupportingText);

  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function clearCards() { 
  if(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function updateUI(data) {
  clearCards();

  for(let i = 0; i < data.length; i++) {
    console.log('updating ui');
    createCard(data[i])
  }
}

let url = 'https://pwa-training-4a918.firebaseio.com/posts.json';
let networkDataRecieved = false;

fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {

    console.log('data', data);
    console.log('Fetch Response');
    networkDataRecieved = true;
    let dataArray = [];
    for(let key in data) {
      dataArray.push(data[key]);
    }
    updateUI(dataArray)
  });

if('caches' in window) {
  caches.match(url).then(response => {
    if(response) {
      return response.json()
    }
  })
  .then(data => {
    console.log('Cache Response');

    if(!networkDataRecieved) {
      clearCards();
      createCard('From Cache');
    }

  })
}

