const Produit = require('./produit'); // Modèle Mongoose pour les produits

// Créer un nouveau produit
const createProduit = async (nom, description) => {
  const nouveauProduit = new Produit({ nom, description }); // Créer un nouveau produit
  return await nouveauProduit.save(); // Sauvegarder le produit
};

// Obtenir tous les produits
const getProduits = async () => {
  return await Produit.find(); // Obtenir tous les produits
};

// Obtenir un produit par ID
const getProduitById = async (id) => {
  const produit = await Produit.findById(id); // Trouver un produit par ID
  if (!produit) {
    throw new Error("Produit non trouvé"); // Si le produit n'existe pas
  }
  return produit; // Retourner le produit trouvé
};

// Supprimer un produit par ID
const deleteProduit = async (produitId) => {
  const produit = await Produit.findByIdAndDelete(produitId); // Supprimer par ID
  if (!produit) {
    throw new Error("Produit non trouvé"); // Si le produit n'existe pas
  }
  return produit; // Retourner le produit supprimé
};

// Exporter les services
module.exports = {
  createProduit,
  getProduits,
  getProduitById,
  deleteProduit,
};
