const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceKey.json');
const datetime_lib = require('./it_datetime');

let userToken = '';

const COLLECTION_NAME = 'notification-history'

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://plantix-e6ae9-default-rtdb.asia-southeast1.firebasedatabase.app/"  // เปลี่ยนเป็น URL ของ Realtime Database ของคุณ
});

const database = admin.database();
const dbFireStore = admin.firestore();

const sensorsRef = database.ref('sensors');
const settingRef = database.ref('settings');

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

    console.log(`token : ${userToken}`)

    // ส่งข้อความไปยัง device token ที่กำหนด
    admin.messaging().send({
        token: userToken,
        notification: payload.notification
    })
        .then(response => {
            console.log('Successfully sent message:', response);
        })
        .catch(error => {
            console.log('Error sending message:', error);
        });
}



function insertCollection(dataObject) {
    const sensorId = uuidv4()

    const db = admin.firestore();
    const sensorRef = db.collection(COLLECTION_NAME).doc(sensorId);

    dataObject.date = datetime_lib.getDate()
    dataObject.time = datetime_lib.getTime()

    sensorRef.set(dataObject)
        .then(() => {
            console.log(`Sensor data for ${sensorId} saved successfully!`);
        })
        .catch((error) => {
            console.error('Error saving sensor data:', error);
        });
}
async function deleteCollection(collectionName) {
    const collectionRef = dbFireStore.collection(collectionName);
    const snapshot = await collectionRef.get();

    snapshot.forEach(async (doc) => {
        await doc.ref.delete(); // ลบเอกสาร
        console.log(`Deleted document: ${doc.id}`);
    });
}


async function CheckNotiCondition() {

    try {
        // ดึงข้อมูลจาก 'sensors' และ 'settings' พร้อมกัน
        const sensorSnapshot = await sensorsRef.once('value');
        const settingSnapshot = await settingRef.once('value');

        const sensorData = sensorSnapshot.val();  // ข้อมูลจาก sensors
        const settingData = settingSnapshot.val();  // ข้อมูลจาก sensors


        if (settingData.isMoistureEnabled) {
            if (sensorData.soilMoisture < settingData.lowerMoistureValue) {
                const dataObject = {
                    icon: 'humidity.png',
                    title: 'เเจ้งเตือนความชื้นในดิน',
                    body: `ความชื้นในดิน ${sensorData.soilMoisture} ตํ่ากว่า ${settingData.lowerMoistureValue} %`,
                };
                sendNotificationToDevice(dataObject);
                insertCollection(dataObject);
                
            }else if(sensorData.soilMoisture > settingData.upperMoistureValue){
                const dataObject = {
                    icon: 'humidity.png',
                    title: 'เเจ้งเตือนความชื้นในดิน',
                    body: `ความชื้นในดิน ${sensorData.soilMoisture} สูงกว่า ${settingData.upperMoistureValue} %`,
                };
                sendNotificationToDevice(dataObject);
                insertCollection(dataObject);
            }
        }


        if (settingData.isTemperatureEnabled) {
            if (sensorData.temperatureDHT < settingData.lowerTemperatureValue) {
                const dataObject = {
                    icon: 'soil_moisture.png',
                    title: 'เเจ้งเตือนอุณหภูมิในดิน',
                    body: `อุณหภูมิในดิน ${sensorData.temperatureDHT} ตํ่ากว่า ${settingData.lowerTemperatureValue} °C`,
                };
                sendNotificationToDevice(dataObject);
                insertCollection(dataObject);
                
            }else if(sensorData.temperatureDHT > settingData.upperTemperatureValue){
                const dataObject = {
                    icon: 'soil_moisture.png',
                    title: 'เเจ้งเตือนอุณหภูมิในดิน',
                    body: `อุณหภูมิในดิน ${sensorData.temperatureDHT} สูงกว่า ${settingData.upperTemperatureValue} °C`,
                };
                sendNotificationToDevice(dataObject);
                insertCollection(dataObject);
            }
        }


        if (settingData.isAirHumidityEnabled) {
            if (sensorData.humidity < settingData.lowerAirHumidityValue) {
                const dataObject = {
                    icon: 'rain.png',
                    title: 'เเจ้งเตือนความชื้นในอากาศ',
                    body: `ความชื้นในอากาศ ${sensorData.humidity} ตํ่ากว่า ${settingData.lowerAirHumidityValue} %`,
                };
                sendNotificationToDevice(dataObject);
                insertCollection(dataObject);
                
            }else if(sensorData.humidity > settingData.upperAirHumidityValue){
                const dataObject = {
                    icon: 'rain.png',
                    title: 'เเจ้งเตือนความชื้นในอากาศ',
                    body: `ความชื้นในอากาศ ${sensorData.humidity} สูงกว่า ${settingData.upperAirHumidityValue} %`,
                };
                sendNotificationToDevice(dataObject);
                insertCollection(dataObject);
            }
        }

        if (settingData.isAirTemperatureEnabled) {
            if (sensorData.temperatureDS18B20 < settingData.lowerAirTemperatureValue) {
                const dataObject = {
                    icon: 'low-temperature.png',
                    title: 'เเจ้งเตือนอุณหภูมิในอากาศ',
                    body: `อุณหภูมิในอากาศ ${sensorData.temperatureDS18B20} ตํ่ากว่า ${settingData.lowerAirTemperatureValue} °C`,
                };
                sendNotificationToDevice(dataObject);
                insertCollection(dataObject);
                
            }else if(sensorData.temperatureDS18B20 > settingData.upperAirTemperatureValue){
                const dataObject = {
                    icon: 'low-temperature.png',
                    title: 'เเจ้งเตือนอุณหภูมิในอากาศ',
                    body: `อุณหภูมิในอากาศ ${sensorData.temperatureDS18B20} สูงกว่า ${settingData.upperAirTemperatureValue} °C`,
                };
                sendNotificationToDevice(dataObject);
                insertCollection(dataObject);
            }
        }

        

        console.log('Sensor Data:', sensorData);
        console.log('Setting Data:', settingData);

        
    } catch (error) {
        console.error('Error fetching data:', error);
    }


}

async function main() {
    sensorsRef.on('child_changed', (snapshot) => {
        const changedData = snapshot.val();
        CheckNotiCondition();
    });
    // deleteCollection(COLLECTION_NAME)

}

main();
