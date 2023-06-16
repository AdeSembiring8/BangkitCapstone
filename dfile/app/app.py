from flask import Flask, jsonify, request
import tensorflow as tf

app = Flask(__name__)

# Load your TensorFlow model
model = tf.keras.models.load_model("./saved_model/1/saved_model.pb")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    input_data = data.get("input", None)

    if input_data is None:
        return jsonify({"error": "Missing 'input' key in the request data"}), 400

    # Perform inference using your model
    prediction = model.predict([input_data])

    return jsonify({"prediction": prediction.tolist()})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)