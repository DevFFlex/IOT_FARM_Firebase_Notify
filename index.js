const { v4: uuidv4 } = require('uuid');
const { GoogleAuth } = require('google-auth-library');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
// const serviceAccount = require('./serviceKey2.json');
const datetime_lib = require('./it_datetime');


const DEBUG_LOG = false

let userToken = '';

const COLLECTION_NOTIFY_HISTORY = 'notification-history'
const COLLECTION_AUTOMATIC_CONTROL_HISTORY = 'automatic-control-history'

const credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(credentials),
    databaseURL: "https://plantix-e6ae9-default-rtdb.asia-southeast1.firebasedatabase.app/"  // เปลี่ยนเป็น URL ของ Realtime Database ของคุณ
});

const database = admin.database();
const dbFireStore = admin.firestore();

const sensorsRef = database.ref('sensors');
const settingRef = database.ref('settings');
const automaticControlListRef = database.ref('AutomaticControlList');
const automaticControlRef = database.ref('AutomaticControl');
// const relayControlStatusRef = database.ref('relayControlStatus');

const FCM_tokenRef = database.ref('FCM_token'); // path ของ sensors

// ฟังก์ชันส่งการแจ้งเตือน
async function sendNotificationToDevice(dataObject) {
    const payload = {
        notification: {
            title: dataObject.title,
            body: dataObject.body,
        },
    };

    userToken = (await FCM_tokenRef.once('value')).val();


    admin.messaging().send({
        token: userToken,
        notification: payload.notification
    })
        .then(response => {
            if (DEBUG_LOG) console.log('Successfully sent message:', response);
        })
        .catch(error => {
            if (DEBUG_LOG) console.log('Error sending message:', error);
        });
}

// if (currentSoilMoisture < lowerThreshold) {
//   print("ความชื้นในดินต่ำเกินไป เปิดการรดน้ำ");
//   await relayRef.set(true);
//   insertAutomaticControl("เปิดนํ้าอัตโนมัติ",getDateNow(),getTimeNow());
// } else if (currentSoilMoisture > upperThreshold) {
//   print("ความชื้นในดินสูงเกินไป ปิดการรดน้ำ");
//   insertAutomaticControl("ปิดนํ้าอัตโนมัติ",getDateNow(),getTimeNow());
//   await relayRef.set(false);
// }

const onAllRelay = () => {
    const r1Ref = database.ref('relay/relay1');
    const r2Ref = database.ref('relay/relay2');
    const r3Ref = database.ref('relay/relay3');
    insertCollectionAutomaticControlHistory("เปิดนํ้าอัตโนมัติ");
    console.log('---- on relay')
    r1Ref.set(true).then(() => {
        // console.log('Data saved successfully!');
    }).catch((error) => {
        console.error('Error saving data: ', error);
    });

    r2Ref.set(true).then(() => {
        // console.log('Data saved successfully!');
    }).catch((error) => {
        console.error('Error saving data: ', error);
    });

    r3Ref.set(true).then(() => {
        // console.log('Data saved successfully!');
    }).catch((error) => {
        console.error('Error saving data: ', error);
    });
}
const offAllRelay = () => {
    const r1Ref = database.ref('relay/relay1');
    const r2Ref = database.ref('relay/relay2');
    const r3Ref = database.ref('relay/relay3');
    insertCollectionAutomaticControlHistory("ปิดนํ้าอัตโนมัติ");
    console.log('---- off relay')
    r1Ref.set(false).then(() => {
        // console.log('Data saved successfully!');
    }).catch((error) => {
        console.error('Error saving data: ', error);
    });

    r2Ref.set(false).then(() => {
        // console.log('Data saved successfully!');
    }).catch((error) => {
        console.error('Error saving data: ', error);
    });

    r3Ref.set(false).then(() => {
        // console.log('Data saved successfully!');
    }).catch((error) => {
        console.error('Error saving data: ', error);
    });
}

function insertCollectionNotificationHistory(dataObject) {
    const sensorId = uuidv4()

    const db = admin.firestore();
    const sensorRef = db.collection(COLLECTION_NOTIFY_HISTORY).doc(sensorId);

    dataObject.date = datetime_lib.getDate()
    dataObject.time = datetime_lib.getTime()

    sensorRef.set(dataObject)
        .then(() => {
            if (DEBUG_LOG) console.log(`Sensor data for ${sensorId} saved successfully!`);
        })
        .catch((error) => {
            if (DEBUG_LOG) console.error('Error saving sensor data:', error);
        });
}
function insertCollectionAutomaticControlHistory(title) {
    const sensorId = uuidv4()

    const db = admin.firestore();
    const sensorRef = db.collection(COLLECTION_AUTOMATIC_CONTROL_HISTORY).doc(sensorId);

    sensorRef.set({
        title: title,
        date: datetime_lib.getDate(),
        time: datetime_lib.getTime()
    })
        .then(() => {
            if (DEBUG_LOG) console.log(`Automatic Control data for ${sensorId} saved successfully!`);
        })
        .catch((error) => {
            if (DEBUG_LOG) console.error('Error saving Automatic Control data:', error);
        });
}
async function deleteCollection(collectionName) {
    const collectionRef = dbFireStore.collection(collectionName);
    const snapshot = await collectionRef.get();

    snapshot.forEach(async (doc) => {
        await doc.ref.delete(); // ลบเอกสาร
        if (DEBUG_LOG) console.log(`Deleted document: ${doc.id}`);
    });
}

async function getAutomationList() {
    return new Promise(async (resolve, reject) => {
        const automaticControlListSnapshot = await automaticControlListRef.once('value');
        const automaticControlList = automaticControlListSnapshot.val();  // ข้อมูลจาก sensors

        const list = Object.entries(automaticControlList).map(([key, value]) => ({
            key, // เพิ่ม key ของแต่ละ item เข้าไปใน object
            ...value // รวมข้อมูลของ value
        }));

        resolve(list)
    })
}

let bufferList = [];
getAutomationList().then(data => {
    bufferList = data;
})

async function CheckSensorSettingCondition(snapshot) {
    try {
        const sensorSnapshot = await sensorsRef.once('value');
        const settingSnapshot = await settingRef.once('value');
        const automaticControlListSnapshot = await automaticControlListRef.once('value');


        const sensorData = sensorSnapshot.val();  // ข้อมูลจาก sensors
        const settingData = settingSnapshot.val();  // ข้อมูลจาก sensors
        const automaticControlList = automaticControlListSnapshot.val();  // ข้อมูลจาก sensors



        





        for (const key in automaticControlList) {
            if (automaticControlList.hasOwnProperty(key)) {
                const farm = automaticControlList[key];
                // console.log(`Farm Name: ${farm.farm_name}`);
                // console.log(`Crop Type: ${farm.crop_type}`);
                // console.log(`Is Automatic: ${farm.isAutomatic}`);
                // console.log(`Lower Threshold: ${farm.lowerThreshold}`);
                // console.log(`Upper Threshold: ${farm.upperThreshold}`);
                // console.log('---------------------------');

                if (farm.isAutomatic) {
                    if (sensorData.soilMoisture > farm.upperThreshold) {
                        offAllRelay()
                    } else if (sensorData.soilMoisture < farm.lowerThreshold) {
                        onAllRelay();
                    }

                }


                const findIndex = bufferList.findIndex(item => item.key === key)

                if (bufferList[findIndex].isAutomatic !== farm.isAutomatic) {
                    console.log(`${key} not ${farm.isAutomatic}`);
                    bufferList[findIndex].isAutomatic = farm.isAutomatic
                }
            }




        }

        if (settingData.isMoistureEnabled && snapshot.key == 'soilMoisture') {
            if (sensorData.soilMoisture < settingData.lowerMoistureValue) {
                const dataObject = {
                    icon: 'humidity.png',
                    title: 'เเจ้งเตือนความชื้นในดิน',
                    body: `ความชื้นในดิน ${sensorData.soilMoisture} ตํ่ากว่า ${settingData.lowerMoistureValue} %`,
                };
                sendNotificationToDevice(dataObject);
                insertCollectionNotificationHistory(dataObject);

            } else if (sensorData.soilMoisture > settingData.upperMoistureValue) {
                const dataObject = {
                    icon: 'humidity.png',
                    title: 'เเจ้งเตือนความชื้นในดิน',
                    body: `ความชื้นในดิน ${sensorData.soilMoisture} สูงกว่า ${settingData.upperMoistureValue} %`,
                };
                sendNotificationToDevice(dataObject);
                insertCollectionNotificationHistory(dataObject);
            }
        }


        if (settingData.isTemperatureEnabled && snapshot.key == 'temperatureDHT') {
            if (sensorData.temperatureDHT < settingData.lowerTemperatureValue) {
                const dataObject = {
                    icon: 'soil_moisture.png',
                    title: 'เเจ้งเตือนอุณหภูมิในดิน',
                    body: `อุณหภูมิในดิน ${sensorData.temperatureDHT} ตํ่ากว่า ${settingData.lowerTemperatureValue} °C`,
                };
                sendNotificationToDevice(dataObject);
                insertCollectionNotificationHistory(dataObject);

            } else if (sensorData.temperatureDHT > settingData.upperTemperatureValue) {
                const dataObject = {
                    icon: 'soil_moisture.png',
                    title: 'เเจ้งเตือนอุณหภูมิในดิน',
                    body: `อุณหภูมิในดิน ${sensorData.temperatureDHT} สูงกว่า ${settingData.upperTemperatureValue} °C`,
                };
                sendNotificationToDevice(dataObject);
                insertCollectionNotificationHistory(dataObject);
            }
        }


        if (settingData.isAirHumidityEnabled && snapshot.key == 'humidity') {
            if (sensorData.humidity < settingData.lowerAirHumidityValue) {
                const dataObject = {
                    icon: 'rain.png',
                    title: 'เเจ้งเตือนความชื้นในอากาศ',
                    body: `ความชื้นในอากาศ ${sensorData.humidity} ตํ่ากว่า ${settingData.lowerAirHumidityValue} %`,
                };
                sendNotificationToDevice(dataObject);
                insertCollectionNotificationHistory(dataObject);

            } else if (sensorData.humidity > settingData.upperAirHumidityValue) {
                const dataObject = {
                    icon: 'rain.png',
                    title: 'เเจ้งเตือนความชื้นในอากาศ',
                    body: `ความชื้นในอากาศ ${sensorData.humidity} สูงกว่า ${settingData.upperAirHumidityValue} %`,
                };
                sendNotificationToDevice(dataObject);
                insertCollectionNotificationHistory(dataObject);
            }
        }

        if (settingData.isAirTemperatureEnabled && snapshot.key == 'temperatureDS18B20') {
            if (sensorData.temperatureDS18B20 < settingData.lowerAirTemperatureValue) {
                const dataObject = {
                    icon: 'low-temperature.png',
                    title: 'เเจ้งเตือนอุณหภูมิในอากาศ',
                    body: `อุณหภูมิในอากาศ ${sensorData.temperatureDS18B20} ตํ่ากว่า ${settingData.lowerAirTemperatureValue} °C`,
                };
                sendNotificationToDevice(dataObject);
                insertCollectionNotificationHistory(dataObject);

            } else if (sensorData.temperatureDS18B20 > settingData.upperAirTemperatureValue) {
                const dataObject = {
                    icon: 'low-temperature.png',
                    title: 'เเจ้งเตือนอุณหภูมิในอากาศ',
                    body: `อุณหภูมิในอากาศ ${sensorData.temperatureDS18B20} สูงกว่า ${settingData.upperAirTemperatureValue} °C`,
                };
                sendNotificationToDevice(dataObject);
                insertCollectionNotificationHistory(dataObject);
            }
        }

        console.log(`${datetime_lib.getDate()}  ${datetime_lib.getTime()}\t\tcheck condition `)
    } catch (error) {
        console.error('Error fetching data:', error);
    }


}

async function CheckAutomaticControlCondition(snapshot) {
    const sensorSnapshot = await sensorsRef.once('value');
    const automaticControlSnapshot = await automaticControlRef.once('value');

    const sensorData = sensorSnapshot.val();
    const automaticControlData = automaticControlSnapshot.val();


    if (snapshot.key == 'soilMoisture' && automaticControlData.isAutomatic) {
        if (sensorData.soilMoisture < automaticControlData.lowerThreshold) {
            const dataObject = {
                icon: 'plant.png',
                title: 'ความชื้นในดินต่ำเกินไป เปิดการรดน้ำ',
                body: `ความชื้นในดินต่ำเกินไป เปิดการรดน้ำ`,
            };
            sendNotificationToDevice(dataObject);
            insertCollectionNotificationHistory(dataObject);

            insertCollectionAutomaticControlHistory("เปิดนํ้าอัตโนมัติ");

        } else if (sensorData.soilMoisture > automaticControlData.upperThreshold) {
            const dataObject = {
                icon: 'plant.png',
                title: 'ความชื้นในดินสูงเกินไป ปิดการรดน้ำ',
                body: `ความชื้นในดินสูงเกินไป ปิดการรดน้ำ`,
            };
            sendNotificationToDevice(dataObject);
            insertCollectionNotificationHistory(dataObject);

            insertCollectionAutomaticControlHistory("ปิดนํ้าอัตโนมัติ");
        }
    }
}

async function main() {
    console.log("start server notification and backend process...");
    sensorsRef.on('child_changed', (snapshot) => {
        const changedData = snapshot.val();
        CheckSensorSettingCondition(snapshot);
        CheckAutomaticControlCondition(snapshot);
    });

    // ใช้ ref สำหรับติดตามข้อมูลในเส้นทางที่กำหนด
    const automaticControlListRef = database.ref('AutomaticControlList');  // กำหนดเส้นทางที่ต้องการติดตาม
    automaticControlListRef.on('child_changed', (snapshot) => {
        const changedData = snapshot.val();
        if(!changedData.isAutomatic){
            offAllRelay();
        }
        console.log('ข้อมูลที่เปลี่ยนแปลง:', changedData);
    });

    const automaticControlRef = database.ref('AutomaticControl');
    automaticControlRef.on('child_changed', (snapshot) => {
        const changedData = snapshot.val();
        console.log(`key ${snapshot.key} change to ${changedData}`)

    });




    // deleteCollection(COLLECTION_NAME)

}

main();
