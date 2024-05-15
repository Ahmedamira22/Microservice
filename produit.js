const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const produitSchema = new Schema({
  nom: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const Produit = mongoose.model('Produit', produitSchema); // Créer le modèle
module.exports = Produit; // Exporter le modèle
