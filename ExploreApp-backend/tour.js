require("dotenv").config();
const mongoose = require("mongoose");
const dns = require('dns');
const Tour = require("./models/Tour");
dns.setServers([
  '0.0.0.0',
  '1.1.1.1'
])
mongoose.connect(process.env.MONGODB_URI);

const DATA = [
  {
    packageId: '1',
    title: 'Northern Lights Experience in Norway',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
    duration: '2 Days',
    people: '12 People',
    rating: 4.9,
    location: 'Norway',
    price: 45000,
    gallery: [
      "https://images.unsplash.com/photo-1531366930499-41f53c175731",
      "https://images.unsplash.com/photo-1483347756197-71ef80e95f73",
      "https://images.unsplash.com/photo-1579033461380-adb47c3eb938",
    ]
  },
  {
    packageId: '2',
    title: 'Dubai Desert Safari Adventure',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
    duration: '1 Day',
    people: '20 People',
    rating: 4.7,
    location: 'Dubai',
    price: 65000,
    gallery: [
      "https://images.unsplash.com/photo-1506461883276-594a12b11cf3",
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa",
      "https://images.unsplash.com/photo-1509059852496-f3822ae057bf",
    ]
  },
  {
    packageId: '3',
    title: 'Bali Beach Relax Tour',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    duration: '5 Days',
    people: '10 People',
    rating: 4.8,
    location: 'Bali, Indonesia',
    price: 75000,
    gallery: [
      "https://images.unsplash.com/photo-1519046904884-53103b34b206",
      "https://images.unsplash.com/photo-1473119177891-7440fe9a00aa",
      "https://images.unsplash.com/photo-1506929662033-75393669402d",
    ]
  },
  {
    packageId: '4',
    title: 'Manali Snow Adventure',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
    duration: '3 Days',
    people: '8 People',
    rating: 4.6,
    location: 'Manali, India',
    price: 89000,
    gallery: [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
      "https://images.unsplash.com/photo-1434394354979-a235cd36269d",
      "https://images.unsplash.com/photo-1454496522485-0a62b42a4f4c",
    ]
  },
  {
    packageId: '5',
    title: 'Thailand Island Trip',
    image: 'https://images.unsplash.com/photo-1493558103817-58b2924bce98',
    duration: '4 Days',
    people: '15 People',
    rating: 4.9,
    location: 'Thailand',
    price: 45000,
    gallery: [
      "https://images.unsplash.com/photo-1493558103817-58b2924bce98",
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a",
      "https://images.unsplash.com/photo-1528181304800-2f173f7533ad",
    ]
  },
];


const sendData = async () => {
  try {
    await Tour.deleteMany();

    await Tour.insertMany(DATA);

    console.log("Tours Inserted with Galleries");

    process.exit();
  } catch (error) {
    console.log(error);

    process.exit(1);
  }
};

sendData();