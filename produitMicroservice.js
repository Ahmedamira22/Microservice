const grpc = require('@grpc/grpc-js'); // Pour gRPC
const protoLoader = require('@grpc/proto-loader'); // Pour charger Protobuf
const mongoose = require('mongoose'); // Pour MongoDB
const Produit = require('./produit'); // Modèle Mongoose pour les produits

// Chemin vers le fichier Protobuf des produits
const produitProtoPath = './produit.proto'; 

// Charger le Protobuf
const produitProtoDefinition = protoLoader.loadSync(produitProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Charger le service Produit du package gRPC
const produitProto = grpc.loadPackageDefinition(produitProtoDefinition).produit;

// Connexion à MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/micro') // Connexion à MongoDB
  .then(() => console.log('Connecté à MongoDB'))
  .catch((err) => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1); // Quitter si la connexion échoue
  });

// Implémentation du service gRPC pour les produits
const produitService = {
  getProduit: async (call, callback) => {
    try {
      const produitId = call.request.produit_id;
      const produit = await Produit.findById(produitId);

      if (!produit) {
        return callback(new Error("Produit non trouvé"));
      }

      callback(null, { produit }); // Retourner le produit trouvé
    } catch (err) {
      callback(new Error("Erreur lors de la recherche du produit: " + err.message)); // Gérer les erreurs
    }
  },

  searchProduits: async (call, callback) => {
    try {
      const produits = await Produit.find(); // Obtenir tous les produits
      callback(null, { produits });
    } catch (err) {
      callback(new Error("Erreur lors de la recherche des produits: " + err.message)); // Gérer les erreurs
    }
  },

  createProduit: async (call, callback) => {
    try {
      const { nom, description } = call.request;
  
      // Check if the required 'nom' field is provided
      if (!nom) {
        return callback(new Error("Le champ 'nom' est obligatoire"));
      }
  
      const nouveauProduit = new Produit({ nom, description });
      const produit = await nouveauProduit.save();
  
      callback(null, { produit });
    } catch (err) {
      callback(new Error("Erreur lors de la création du produit: " + err.message));
    }
  },
  updateProduit: async (call, callback) => {
    try {
      const { produit_id, nom, description } = call.request;
      const produit = await Produit.findByIdAndUpdate(
        produit_id,
        { nom, description },
        { new: true }
      );

      if (!produit) {
        return callback(new Error("Produit non trouvé")); // Si le produit n'est pas trouvé
      }

      callback(null, { produit }); // Produit mis à jour
    } catch (err) {
      callback(new Error("Erreur lors de la mise à jour du produit: " + err.message)); // Gérer les erreurs
    }
  },
  deleteProduit: async (call, callback) => {
    try {
      const produitId = call.request.produit_id; // Identifiant du produit
      const produit = await Produit.findByIdAndDelete(produitId); // Supprimer par ID

      if (!produit) {
        return callback(new Error("Produit non trouvé")); // Gérer le cas où le produit n'existe pas
      }

      callback(null, { message: "Produit supprimé avec succès" }); // Réponse de succès
    } catch (err) {
      callback(new Error("Erreur lors de la suppression du produit: " + err.message)); // Gérer les erreurs
    }
  },
};

// Créer le serveur gRPC
const server = new grpc.Server(); // Créer un serveur gRPC
server.addService(produitProto.ProduitService.service, produitService); // Ajouter le service Produit

server.bindAsync('0.0.0.0:50054', grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    console.error("Échec de la liaison du serveur:", err);
    return;
  }
  server.start();
  console.log(`Service Produit opérationnel sur le port ${boundPort}`); // Confirmation du démarrage du service
});
