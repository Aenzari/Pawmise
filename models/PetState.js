const mongoose = require("mongoose");

const CouponInstanceSchema = new mongoose.Schema({
  instanceId: String,
  couponId: String,
  title: String,
  icon: String,
  redeemedAt: String,
  used: { type: Boolean, default: false },
});

const TaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  exp: { type: Number, required: true },
  done: { type: Boolean, default: false },
});

const AnswerSchema = new mongoose.Schema({
  text: { type: String, default: "" },
  locked: { type: Boolean, default: false },
});

const PetStateSchema = new mongoose.Schema(
  {
    petName: { type: String, default: "Otto" },
    level: { type: Number, default: 1 },
    currentExp: { type: Number, default: 0 },
    expToNext: { type: Number, default: 100 },
    couponsSaved: { type: Number, default: 0 },
    spendableExp: { type: Number, default: 0 },
    inventory: { type: [CouponInstanceSchema], default: [] },
    tasks: {
      type: [TaskSchema],
      default: [
        { id: "clean", label: "Clean together", exp: 20, done: false },
        { id: "duo", label: "Win a duo match", exp: 30, done: false },
        { id: "walk", label: "Evening walk", exp: 15, done: false },
        { id: "cook", label: "Cook dinner together", exp: 25, done: false },
      ],
    },
    dailyQuestion: {
      prompt: {
        type: String,
        default: "What is your favorite memory of us from this past month?",
      },
      revealed: { type: Boolean, default: false },
      answers: {
        p1: { type: AnswerSchema, default: () => ({}) },
        p2: { type: AnswerSchema, default: () => ({}) },
      },
    },
    history: [
      {
        prompt: String,
        p1Answer: String,
        p2Answer: String,
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("PetState", PetStateSchema);
