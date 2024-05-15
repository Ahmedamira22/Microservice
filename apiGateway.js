const express = require('express'); // Framework Express
const bodyParser = require('body-parser'); // Pour traiter le JSON
const cors = require('cors'); // Pour autoriser les requêtes cross-origin

const connectDB = require('./database'); // Connexion à MongoDB
const Client = require('./client'); // Modèle Client
const Produit = require('./produit'); // Modèle Produit
const { sendClientMessage } = require('./clientProducer'); // Producteur Kafka pour les clients
const { sendProduitMessage } = require('./produitProducer'); // Producteur Kafka pour les produits

const app = express(); // Créer l'application Express

// Connexion à MongoDB
connectDB();

app.use(cors()); // Autoriser les requêtes cross-origin
app.use(bodyParser.json()); // Traiter le JSON

// Endpoints pour les clients
app.get('/client', async (req, res) => {
  try {
    const clients = await Client.find(); // Obtenir tous les clients
    res.json(clients);
  } catch (err) {
    res.status(500).send("Erreur lors de la recherche des clients: " + err.message);
  }
});

app.get('/client/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id); // Obtenir le client par ID
    if (!client) {
      return res.status(404).send("Client non trouvé");
    }
    res.json(client);
  } catch (err) {
    res.status(500).send("Erreur lors de la recherche du client: " + err.message);
  }
});

app.post('/client', async (req, res) => {
  try {
    const { nom, description } = req.body; // Obtenir les données du corps de la requête
    const nouveauClient = new Client({ nom, description });
    const client = await nouveauClient.save(); // Sauvegarder le client
// Envoyer un message Kafka pour l'événement de création
await sendClientMessage('creation', { id: client._id, nom, description });
    res.json(client); // Retourner le client créé
  } catch (err) {
    res.status(500).send("Erreur lors de la création du client: " + err.message);
  }
});

// Suppression d'un client par ID
app.delete('/client/:id', async (req, res) => {
  try {
    const clientId = req.params.id;
    const client = await Client.findByIdAndDelete(clientId); // Supprimer par ID

    if (!client) {
      return res.status(404).send("Client non trouvé"); 
    }
 // Envoyer un message Kafka pour l'événement de suppression
 await sendClientMessage('suppression', { id: client._id });
    res.send("Client supprimé avec succès"); 
  } catch (err) {
    res.status(500).send("Erreur lors de la suppression du client: " + err.message); 
  }
});


// Endpoints pour les produits
app.get('/produit', async (req, res) => {
  try {
    const produits = await Produit.find(); // Obtenir tous les produits
    res.json(produits);
  } catch (err) {
    res.status(500).send("Erreur lors de la recherche des produits: " + err.message);
  }
});

app.get('/produit/:id', async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id); // Obtenir le produit par ID
    if (!produit) {
      return res.status(404).send("Produit non trouvé");
    }
    res.json(produit);
  } catch (err) {
    res.status(500).send("Erreur lors de la recherche du produit: " + err.message);
  }
});

app.post('/produit', async (req, res) => {
  try {
    const { nom, description } = req.body;
    const nouveauProduit = new Produit({ nom, description });
    const produit = await nouveauProduit.save(); // Sauvegarder le produit
// Envoyer un message Kafka pour l'événement de création de produit
await sendProduitMessage('creation', { id: produit._id, nom, description });
    res.json(produit); // Retourner le produit créé
  } catch (err) {
    res.status(500).send("Erreur lors de la création du produit: " + err.message);
  }
});
// Endpoint pour supprimer un produit par ID
app.delete('/produit/:id', async (req, res) => {
  try {
    const produitId = req.params.id; // ID du produit
    const produit = await Produit.findByIdAndDelete(produitId); // Supprimer par ID

    if (!produit) {
      return res.status(404).send("Produit non trouvé"); // Gérer le cas où le produit n'existe pas
    }
// Envoyer un message Kafka pour l'événement de suppression de produit
await sendProduitMessage('suppression', { id: produit._id });
    res.send("Produit supprimé avec succès"); // Message de confirmation
  } catch (err) {
    res.status(500).send("Erreur lors de la suppression du produit: " + err.message); // Gérer les erreurs
  }
});
// Endpoint pour mettre à jour un client par ID
app.put('/client/:id', async (req, res) => {
  try {
    const clientId = req.params.id; // Obtenir l'ID du client
    const { nom, description } = req.body; // Obtenir les données de mise à jour

    const client = await Client.findByIdAndUpdate(
      clientId, // Identifier le client à mettre à jour
      { nom, description }, // Données à mettre à jour
      { new: true } // Retourner le client mis à jour
    );

    if (!client) {
      return res.status(404).send("Client non trouvé"); // Gérer le cas où le client n'est pas trouvé
    }
 // Envoyer un message Kafka pour l'événement de modification
 await sendClientMessage('modification', { id: client._id, nom, description });
    res.json(client); // Retourner le client mis à jour
  } catch (err) {
    res.status(500).send("Erreur lors de la mise à jour du client: " + err.message); // Gérer les erreurs
  }
});
// Endpoint pour mettre à jour un produit par ID
app.put('/produit/:id', async (req, res) => {
  try {
    const produitId = req.params.id; // Obtenir l'ID du produit
    const { nom, description } = req.body; // Obtenir les données de mise à jour

    const produit = await Produit.findByIdAndUpdate(
      produitId, // Identifier le produit à mettre à jour
      { nom, description }, // Données à mettre à jour
      { new: true } // Retourner le produit mis à jour
    );

    if (!produit) {
      return res.status(404).send("Produit non trouvé"); // Gérer le cas où le produit n'est pas trouvé
    }
// Envoyer un message Kafka pour l'événement de modification de produit
await sendProduitMessage('modification', { id: produit._id, nom, description });
    res.json(produit); // Retourner le produit mis à jour
  } catch (err) {
    res.status(500).send("Erreur lors de la mise à jour du produit: " + err.message); // Gérer les erreurs
  }
});


// Démarrer le serveur Express
const port = 3001;
app.listen(port, () => {
  console.log(`API Gateway opérationnel sur le port ${port}`); 
});