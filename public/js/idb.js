<script src="./js/index.js"></script>
//variable to hold db connection
let db;
//establish a connection to IndexedDb database called 'budget-tracker' and set it to version 1
const request = indexedDB.open('budget-tracker', 1);

//this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc)
request.onupgradeneeded = function (event) {
    //save a reference to the database
    const db = event.target.result;
    //create an object store (table) called 'new_bank', set it to have an auto incrementing primary key of sorts
    db.createObjectStore('new_bank', { autoIncrement: true });
}

//upon a successful
request.onsuccess = function (event) {
    //when db is successfully created with its object store(from onupgradeneeded)
    db = event.target.result;

    //check if app is online, if yes run uploadtransaction() function to send all loacal data to api
    if (navigator.onLine) {
        //we haven't created this yet, but will soon, so let's comment it out for now
        uploadBank();
    };
};

request.onerror = function (event) {
    //log error here
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new bank and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_bank'], 'readwrite');

    // access the object store for `new_bank`
    const bankObjectStore = transaction.objectStore('new_bank');

    // add record to your store with add method
    bankObjectStore.add(record);
}

function uploadBank() {
    // open a transaction on your db
    const transaction = db.transaction(['new_bank'], 'readwrite');

    // access your object store
    const bankObjectStore = transaction.objectStore('new_bank');

    // get all records from store and set to a variable
    const getAll = bankObjectStore.getAll();

    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['new_bank'], 'readwrite');
                    // access the new_bank object store
                    const bankObjectStore = transaction.objectStore('new_bank');
                    // clear all items in your store
                    bankObjectStore.clear();

                    alert('All saved bank transactions has been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
};

//listen for app comin back online
window.addEventListener('online', uploadBank);