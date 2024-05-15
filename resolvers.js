const { ApolloError } = require('apollo-server'); // Pour gérer les erreurs Apollo
const Client = require('./client'); // Modèle Mongoose Client
const Produit = require('./produit'); // Modèle Mongoose Produit
const grpc = require('@grpc/grpc-js'); // Client gRPC
const protoLoader = require('@grpc/proto-loader'); // Pour charger Protobuf

const { sendClientMessage } = require('./clientProducer'); // Producteur Kafka pour les clients
const { sendProduitMessage } = require('./produitProducer'); // Producteur Kafka pour les produits

// Charger les fichiers Protobuf
const clientProtoPath = './client.proto';
const produitProtoPath = './produit.proto';

// Charger les définitions Protobuf
const clientProtoDefinition = protoLoader.loadSync(clientProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const produitProtoDefinition = protoLoader.loadSync(produitProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Obtenir les services gRPC
const clientProto = grpc.loadPackageDefinition(clientProtoDefinition).client;
const produitProto = grpc.loadPackageDefinition(produitProtoDefinition).produit;

// Créer les clients gRPC
const clientClient = new clientProto.ClientService(
  'localhost:50053', // Adresse du service Client
  grpc.credentials.createInsecure() // Credentials
);

const clientProduit = new produitProto.ProduitService(
  'localhost:50054', // Adresse du service Produit
  grpc.credentials.createInsecure() // Credentials
);


// Résolveurs GraphQL avec Kafka
const resolvers = {
  Query: {
    client: async (_, { id }) => {
      try {
        return await Client.findById(id); // Trouver le client par ID
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche du client: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    clients: async () => {
      try {
        return await Client.find(); // Trouver tous les client
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche des clients: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    produit: async (_, { id }) => {
      try {
        return await Produit.findById(id); // Trouver le produit par ID
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche du produit: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    produits: async () => {
      try {
        return await Produit.find(); // Trouver tous les produits
      } catch (error) {
        throw new ApolloError(`Erreur lors de la recherche des produits: ${error.message}`, "INTERNAL_ERROR");
      }
    },
  },
  
  Mutation: {
    createClient: async (_, { nom, description }) => {
      try {
        const nouveauClient = new Client({ nom, description });
        const client = await nouveauClient.save(); // Sauvegarder le client
        
        // Envoyer un message Kafka pour l'événement de création de client
        await sendClientMessage('creation', { id: client._id, nom, description });

        return client; // Retourner le client créé
      } catch (error) {
        throw new ApolloError(`Erreur lors de la création du client: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    deleteClient: async (_, { id }) => {
      try {
        const client = await Client.findByIdAndDelete(id); // Supprimer par ID
        if (!client) {
          throw new ApolloError("Client non trouvé", "NOT_FOUND");
        }

        // Envoyer un message Kafka pour l'événement de suppression de client
        await sendClientMessage('suppression', { id });

        return "Client supprimé avec succès";
      } catch (error) {
        throw new ApolloError(`Erreur lors de la suppression du client: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    updateClient: async (_, { id, nom, description }) => {
      try {
        const client = await Client.findByIdAndUpdate(
          id,
          { nom, description },
          { new: true } // Retourner le client mis à jour
        );
        
        if (!client) {
          throw new ApolloError("Client non trouvé", "NOT_FOUND");
        }

        // Envoyer un message Kafka pour l'événement de modification de client
        await sendClientMessage('modification', { id: client._id, nom, description });

        return client; // Client mis à jour
      } catch (error) {
        throw new ApolloError(`Erreur lors de la mise à jour du client: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    createProduit: async (_, { nom, description }) => {
      try {
        const nouveauProduit = new Produit({ nom, description });
        const produit = await nouveauProduit.save(); // Sauvegarder le produit
        
        // Envoyer un message Kafka pour l'événement de création de produit
        await sendProduitMessage('creation', { id: produit._id, nom, description });

        return produit; // Retourner le produit créé
      } catch (error) {
        throw new ApolloError(`Erreur lors de la création du produit: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    deleteProduit: async (_, { id }) => {
      try {
        const produit = await Produit.findByIdAndDelete(id); // Supprimer par ID
        
        if (!produit) {
          throw new ApolloError("Produit non trouvé", "NOT_FOUND");
        }

        // Envoyer un message Kafka pour l'événement de suppression de produit
        await sendProduitMessage('suppression', { id });

        return "Produit supprimé avec succès";
      } catch (error) {
        throw new ApolloError(`Erreur lors de la suppression du produit: ${error.message}`, "INTERNAL_ERROR");
      }
    },
    
    updateProduit: async (_, { id, nom, description }) => {
      try {
        const produit = await Produit.findByIdAndUpdate(
          id,
          { nom, description },
          { new: true } // Retourner le produit mis à jour
        );
        
        if (!produit) {
          throw new ApolloError("Produit non trouvé", "NOT_FOUND");
        }

        // Envoyer un message Kafka pour l'événement de modification de produit
        await sendProduitMessage('modification', { id, nom, description });

        return produit; // Produit mis à jour
      } catch (error) {
        throw new ApolloError(`Erreur lors de la mise à jour du produit: ${error.message}`, "INTERNAL_ERROR");
      }
    },
  },
};

module.exports = resolvers;