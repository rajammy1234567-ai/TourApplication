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
    price: '1200',
  },
  {
    packageId: '2',
    title: 'Dubai Desert Safari Adventure',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
    duration: '1 Day',
    people: '20 People',
    rating: 4.7,
    location: 'Dubai',
    price: '300',
  },
  {
    packageId: '3',
    title: 'Bali Beach Relax Tour',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    duration: '5 Days',
    people: '10 People',
    rating: 4.8,
    location: 'Bali, Indonesia',
    price: '800',
  },
  {
    packageId: '4',
    title: 'Manali Snow Adventure',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
    duration: '3 Days',
    people: '8 People',
    rating: 4.6,
    location: 'Manali, India',
    price: '250',
  },
  {
    packageId: '5',
    title: 'Thailand Island Trip',
    image: 'https://images.unsplash.com/photo-1493558103817-58b2924bce98',
    duration: '4 Days',
    people: '15 People',
    rating: 4.9,
    location: 'Thailand',
    price: '600',
  },
];


const sendData = async () => {
  try {
    await Tour.deleteMany();

    await Tour.insertMany(DATA);

    console.log("Tours Inserted");

    process.exit();
  } catch (error) {
    console.log(error);

    process.exit(1);
  }
};

sendData();