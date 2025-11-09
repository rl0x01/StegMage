#!/bin/bash

# StegMage - Script de Déploiement CapRover
# Usage: ./deploy.sh

set -e

echo "🚀 StegMage - Déploiement CapRover"
echo "=================================="
echo ""

# Vérifier si caprover est installé
if ! command -v caprover &> /dev/null; then
    echo "❌ CapRover CLI n'est pas installé!"
    echo ""
    echo "Installation:"
    echo "  npm install -g caprover"
    echo "  ou"
    echo "  brew install caprover"
    exit 1
fi

echo "✅ CapRover CLI détecté"
echo ""

# Vérifier que captain-definition existe
if [ ! -f "captain-definition" ]; then
    echo "❌ Fichier captain-definition introuvable!"
    exit 1
fi

echo "✅ captain-definition trouvé"
echo ""

# Vérifier les variables d'environnement importantes
echo "⚠️  IMPORTANT: Vérifiez que vous avez configuré sur CapRover:"
echo ""
echo "   Variables d'environnement obligatoires:"
echo "   - SECRET_KEY (générer avec: python3 -c \"import secrets; print(secrets.token_hex(32))\")"
echo "   - AUTH_PASSWORD (votre mot de passe fort)"
echo "   - FORCE_HTTPS=true"
echo "   - ALLOWED_ORIGINS=https://votre-domaine.com"
echo "   - REDIS_URL=redis://srv-captain--<redis-app>:6379/0"
echo ""

read -p "Avez-vous configuré toutes les variables d'environnement ? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Déploiement annulé"
    echo "   Configurez d'abord les variables dans CapRover Web UI"
    exit 1
fi

echo ""
echo "🔄 Déploiement en cours..."
echo ""

# Déployer
caprover deploy

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Vérifier les logs: caprover logs -a <app-name>"
echo "   2. Tester le health check: curl https://votre-domaine.com/health"
echo "   3. Se connecter: https://votre-domaine.com/login"
echo ""
echo "🔐 Sécurité:"
echo "   - HTTPS activé: Vérifier dans App > HTTP Settings"
echo "   - Let's Encrypt: Activer dans App > HTTP Settings"
echo "   - Mot de passe: Configuré dans AUTH_PASSWORD"
echo ""
echo "🎉 StegMage est en ligne!"
