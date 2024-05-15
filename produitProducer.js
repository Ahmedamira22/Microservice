const { Kafka  } = require('kafkajs');


const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],

});

const producer = kafka.producer();


const sendProduitMessage = async (eventType, produitData) => {
  try {
    await producer.connect();
    await producer.send({
      topic: 'produit-events', // Le topic où vous souhaitez envoyer les événements d'équipe
      messages: [
        { value: JSON.stringify({ eventType, produitData }) }
      ],
    });
    console.log('Message Kafka envoyé avec succès pour l\'événement:', eventType);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message Kafka:', error);
  } finally {
    await producer.disconnect();
  }
};
module.exports = {
    sendProduitMessage
  };
