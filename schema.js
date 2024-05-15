const { gql } = require('@apollo/server');

const typeDefs = `#graphql
  type Client {
    id: String!
    nom: String!
    description: String!
  }

  type Produit {
    id: String!
    nom: String!
    description: String!
  }

  type Query {
    client(id: String!): Client
    clients: [Client]
    produit(id: String!): Produit
    produits: [Produit]
  }
  
  type Mutation {
    createClient(nom: String!, description: String!): Client
    deleteClient(id: String!): String
    createProduit(nom: String!, description: String!): Produit
    deleteProduit(id: String!): String
    updateClient(id: String!, nom: String!, description: String!): Client # Mutation pour mettre à jour un Client
    updateProduit(id: String!, nom: String!, description: String!): Produit
  }
`;

module.exports = typeDefs;
