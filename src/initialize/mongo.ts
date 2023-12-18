import mongoose from "mongoose";

export const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log(process.env.MONGO_URI)
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
