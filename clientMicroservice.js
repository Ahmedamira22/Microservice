const grpc = require('@grpc/grpc-js'); // Pour gRPC
const protoLoader = require('@grpc/proto-loader'); // Pour charger Protobuf
const mongoose = require('mongoose'); // Pour MongoDB
const Client = require('./client'); // Modèle Mongoose pour les clients
const {sendClientMessage} =require ('./clientProducer')
// Chemin vers le fichier Protobuf
const clientProtoPath = './client.proto'; 

// Charger le Protobuf
const clientProtoDefinition = protoLoader.loadSync(clientProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Charger le service Client du package gRPC
const clientProto = grpc.loadPackageDefinition(clientProtoDefinition).client;

// Connexion à MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/micro') // Utilisez IPv4 pour éviter les problèmes
  .then(() => console.log('Connecté à MongoDB'))
  .catch((err) => {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1); // Quitte le processus en cas d'erreur
  });

// Implémentation du service gRPC pour les clients
const clientService = {
  getClient: async (call, callback) => {
    try {
      const clientId = call.request.client_id;
      const client = await Client.findById(clientId);

      if (!client) {
        return callback(new Error("Client non trouvé"));
      }

      callback(null, { client }); 
    } catch (err) {
      callback(new Error("Erreur lors de la recherche du client")); 
    }
  },

  searchClients: async (call, callback) => {
    try {
      const clients = await Client.find();
      callback(null, { clients });
    } catch (err) {
      callback(new Error("Erreur lors de la recherche des clients")); 
    }
  },

  CreateClient: async (call, callback) => {
    try {
      const { nom, description } = call.request;
      const nouveauClient = new Client({ nom, description });
      const client = await nouveauClient.save();

      callback(null, { client }); 
    } catch (err) {
      callback(new Error("Erreur lors de la création du client")); 
    }
  },
  updateClient: async (call, callback) => {
    try {
      const { client_id, nom, description } = call.request;
      const client = await Client.findByIdAndUpdate(
        client_id,
        { nom, description },
        { new: true }
      );

      if (!client) {
        return callback(new Error("Client non trouvé")); // Si le client n'est pas trouvé
      }

      callback(null, { client }); // Client mis à jour
    } catch (err) {
      callback(new Error("Erreur lors de la mise à jour du client: " + err.message));
    }
  },
  deleteClient: async (call, callback) => {
    try {
      const clientId = call.request.client_id;
      const client = await Client.findByIdAndDelete(clientId); // Supprimer par ID

      if (!client) {
        return callback(new Error("Client non trouvé"));
      }

      callback(null, { message: "Client supprimé avec succès" }); // Réponse de succès
    } catch (err) {
      callback(new Error("Erreur lors de la suppression du client: " + err.message));
    }
    
  },
  
};

// Créer le serveur gRPC
const server = new grpc.Server();
server.addService(clientProto.ClientService.service, clientService);

server.bindAsync('0.0.0.0:50053', grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
  if (err) {
    console.error("Échec de la liaison du serveur:", err);
    return;
  }
  server.start();
  console.log(`Service Client opérationnel sur le port ${boundPort}`);
});
