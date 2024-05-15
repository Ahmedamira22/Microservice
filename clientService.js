const Client = require('./client'); // Modèle Mongoose pour les client

// Créer un nouveau client
const createClient = async (nom, description) => {
  const nouveauClient = new Client({ nom, description });
  return await nouveauClient.save(); // Utilisez `await` pour sauvegarder
};

// Obtenir tous les client
const getClients = async () => {
  return await Client.find(); // Utilisez `await` pour obtenir tous les client
};

// Obtenir un client par ID
const getClientById = async (id) => {
  return await Client.findById(id); // Utilisez `await` pour trouver un client par son ID
};
// Supprimer un client par ID
const deleteClient = async (clientId) => {
  const client = await Client.findByIdAndDelete(clientId); // Utilisez `findByIdAndDelete`
  if (!client) {
    throw new Error("Client non trouvé"); // Si le client n'existe pas
  }
  return client; // Retournez le client supprimé
};
// Exporter les services
module.exports = {
  createClient,
  getClients,
  getClientById,
  deleteClient,
};
