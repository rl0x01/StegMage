# Guide de Déploiement CapRover - StegMage

## 🚀 Méthode Recommandée: Déploiement CLI (Depuis ton PC)

### Prérequis

1. **CapRover installé** sur ton serveur
2. **CapRover CLI** sur ton PC
3. **Accès SSH** au serveur (ou domaine CapRover)

### Étape 1: Installation CapRover CLI

```bash
npm install -g caprover
```

Ou avec Homebrew (macOS):
```bash
brew install caprover
```

### Étape 2: Configuration du Serveur CapRover

Sur ton serveur CapRover (interface web):

1. **Créer l'application**
   - Nom: `stegmage` (ou autre)
   - Activer HTTPS: ✅
   - Enable Persistent Data: ✅

2. **Configurer Redis**
   - Aller dans "One-Click Apps/Databases"
   - Déployer Redis
   - Nom: `stegmage-redis`
   - Noter l'URL de connexion

3. **Variables d'Environnement** (dans App Configs)

   **OBLIGATOIRES:**
   ```bash
   # Générer une clé secrète forte
   SECRET_KEY=<votre-clé-générée>

   # Mot de passe d'accès (sera hashé en SHA256)
   AUTH_PASSWORD=VotreMotDePasseFort123!

   # Sécurité Production
   FORCE_HTTPS=true
   ALLOWED_ORIGINS=https://stegmage.votre-domaine.com

   # Redis (remplacer par l'URL de votre Redis CapRover)
   REDIS_URL=redis://srv-captain--stegmage-redis:6379/0
   ```

   **OPTIONNELS:**
   ```bash
   DEBUG=false
   PORT=8080
   ```

4. **Générer les credentials**

   Sur ton PC:
   ```bash
   # SECRET_KEY (64 caractères)
   python3 -c "import secrets; print(secrets.token_hex(32))"

   # Mot de passe fort (24 caractères)
   python3 -c "import secrets, string; chars = string.ascii_letters + string.digits + string.punctuation; print(''.join(secrets.choice(chars) for _ in range(24)))"
   ```

### Étape 3: Déploiement depuis ton PC

#### Option A: Via CapRover CLI (RECOMMANDÉ)

```bash
# 1. Aller dans le dossier du projet
cd /Users/lrusso/Library/Mobile\ Documents/com~apple~CloudDocs/DEVELOPPEMENT/NetMeSafe/StegMage

# 2. Se connecter à CapRover (première fois seulement)
caprover login

# Répondre aux questions:
# - CapRover URL: https://captain.votre-domaine.com
# - Password: [votre mot de passe admin CapRover]
# - App Name: stegmage

# 3. Déployer
caprover deploy
```

Le déploiement prendra 5-10 minutes (installation des dépendances).

#### Option B: Via Tarball (Alternative)

```bash
# 1. Créer une archive du projet
cd /Users/lrusso/Library/Mobile\ Documents/com~apple~CloudDocs/DEVELOPPEMENT/NetMeSafe/StegMage
tar -czf stegmage-deploy.tar.gz .

# 2. Sur CapRover Web UI:
# - Aller dans votre app "stegmage"
# - Onglet "Deployment"
# - Section "Method 2: Upload captain-definition file"
# - Upload stegmage-deploy.tar.gz
```

### Étape 4: Configuration Post-Déploiement

#### 1. Activer HTTPS (Let's Encrypt)

Sur CapRover Web UI:
```
App > stegmage > HTTP Settings
✅ Enable HTTPS
✅ Force HTTPS by redirecting all HTTP traffic to HTTPS
✅ Use Let's Encrypt
```

#### 2. Configurer le Domaine

```
App > stegmage > HTTP Settings
- Enable HTTPS: ✅
- Connect New Domain: stegmage.votre-domaine.com
- Enable HTTPS pour le nouveau domaine
```

#### 3. Vérifier le Worker (RQ)

Créer une seconde app pour le worker:

```bash
# Sur CapRover, créer une nouvelle app: stegmage-worker
# Variables d'environnement (mêmes que stegmage):
REDIS_URL=redis://srv-captain--stegmage-redis:6379/0

# Dockerfile à utiliser: Dockerfile.worker
# captain-definition:
{
  "schemaVersion": 2,
  "dockerfilePath": "./Dockerfile.worker"
}
```

#### 4. Configurer les Volumes (Persistance)

Sur CapRover:
```
App > stegmage > App Configs > Persistent Directories

Ajouter:
/app/uploads
/app/results
```

### Étape 5: Vérification

#### Test 1: Health Check
```bash
curl https://stegmage.votre-domaine.com/health
```

Résultat attendu:
```json
{
  "status": "healthy",
  "redis": "connected",
  "app": "running"
}
```

#### Test 2: Login
```bash
# Visiter dans le navigateur
https://stegmage.votre-domaine.com
```

Devrait afficher la page de login.

#### Test 3: Logs
```bash
# Via CapRover CLI
caprover logs -a stegmage

# Ou dans CapRover Web UI
App > stegmage > App Logs
```

### Étape 6: Mises à Jour

Pour déployer une mise à jour:

```bash
cd /Users/lrusso/Library/Mobile\ Documents/com~apple~CloudDocs/DEVELOPPEMENT/NetMeSafe/StegMage

# Faire vos modifications...

# Déployer
caprover deploy
```

---

## 🔄 Alternative: Déploiement via Git

### Option Git (si tu veux push automatique)

#### 1. Créer un Repository Git

```bash
cd /Users/lrusso/Library/Mobile\ Documents/com~apple~CloudDocs/DEVELOPPEMENT/NetMeSafe/StegMage

# Initialiser git si pas déjà fait
git init

# Ajouter les fichiers
git add .
git commit -m "Initial commit - StegMage production ready"

# Créer un repo GitHub/GitLab
# Puis:
git remote add origin https://github.com/votre-username/stegmage.git
git branch -M main
git push -u origin main
```

#### 2. Sur CapRover

```
App > stegmage > Deployment > Method 3

Repository: https://github.com/votre-username/stegmage.git
Branch: main
Username: votre-username
Password: votre-personal-access-token (pas le mot de passe!)

Ou utiliser SSH Key (plus sécurisé)
```

#### 3. Webhook Automatique

Copier l'URL webhook fournie par CapRover et l'ajouter dans:
- GitHub: Settings > Webhooks > Add webhook
- GitLab: Settings > Integrations > Webhooks

Maintenant, chaque `git push` déclenche un déploiement automatique!

---

## 📋 Checklist Pré-Déploiement

### Sécurité
- [ ] `SECRET_KEY` généré (64 chars)
- [ ] `AUTH_PASSWORD` fort (16+ chars)
- [ ] `FORCE_HTTPS=true`
- [ ] `ALLOWED_ORIGINS` configuré avec ton domaine
- [ ] `DEBUG=false`
- [ ] HTTPS/Let's Encrypt activé sur CapRover
- [ ] Redis déployé et accessible

### Configuration
- [ ] `captain-definition` présent
- [ ] Variables d'environnement configurées
- [ ] Domaine configuré et DNS pointé
- [ ] Worker déployé (stegmage-worker)
- [ ] Volumes persistants configurés

### Tests
- [ ] Health check retourne `healthy`
- [ ] Page de login accessible
- [ ] Login fonctionnel
- [ ] Upload d'image fonctionne
- [ ] Worker traite les jobs
- [ ] Logs accessibles

---

## 🛠️ Dépannage

### Erreur: "Cannot connect to Redis"

Vérifier:
```bash
# Dans App Configs
REDIS_URL=redis://srv-captain--stegmage-redis:6379/0

# Vérifier que Redis est démarré
# CapRover > Apps > stegmage-redis > Status: Running
```

### Erreur: "Login failed / Authentication required"

Vérifier:
```bash
# Variables d'environnement
AUTH_PASSWORD=VotreMotDePasse  # Doit être défini
SECRET_KEY=...  # Doit être défini
```

Générer un nouveau hash si besoin:
```bash
echo -n "VotreMotDePasse" | shasum -a 256
# Utiliser AUTH_PASSWORD_HASH au lieu de AUTH_PASSWORD
```

### Erreur: "Rate limit exceeded"

C'est normal si tu testes beaucoup. Attendre 15 minutes ou:
```bash
# Via CapRover CLI
caprover exec -a stegmage -- redis-cli -h srv-captain--stegmage-redis FLUSHDB
```

### Logs montrent des erreurs

```bash
# Voir les logs en temps réel
caprover logs -a stegmage -f

# Filtrer les erreurs
caprover logs -a stegmage | grep ERROR
```

### Worker ne traite pas les jobs

Vérifier:
1. Worker app existe et tourne
2. REDIS_URL identique dans web et worker
3. Logs du worker: `caprover logs -a stegmage-worker`

---

## 🎯 Architecture CapRover Finale

```
┌─────────────────────────────────────────┐
│           Load Balancer                 │
│      (HTTPS - Let's Encrypt)            │
└────────────────┬────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼──────┐          ┌───────▼─────┐
│ stegmage │          │ stegmage-   │
│  (web)   │◄────────►│  worker     │
└────┬─────┘          └──────┬──────┘
     │                       │
     │    ┌──────────────────┘
     │    │
┌────▼────▼─────┐
│ stegmage-redis│
│   (cache)     │
└───────────────┘

Persistent Volumes:
- /app/uploads (web)
- /app/results (web + worker)
```

---

## 🔐 Variables d'Environnement - Exemple Complet

```bash
# === OBLIGATOIRES (Production) ===
SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
AUTH_PASSWORD=MyStr0ng!P@ssw0rd#2025$Secur3
FORCE_HTTPS=true
ALLOWED_ORIGINS=https://stegmage.votre-domaine.com
REDIS_URL=redis://srv-captain--stegmage-redis:6379/0

# === OPTIONNELS ===
DEBUG=false
PORT=8080
```

---

## 📊 Monitoring

### Surveiller l'application

```bash
# CPU/Memory usage
caprover stats -a stegmage

# Logs en temps réel
caprover logs -a stegmage -f

# Redémarrer si problème
caprover restart -a stegmage
```

### Métriques importantes

Dans CapRover Web UI:
- **CPU Usage**: < 50% en temps normal
- **Memory**: ~300-500MB (web), ~200-300MB (worker)
- **Disk**: Surveiller /app/uploads et /app/results

### Alertes

Configurer dans CapRover:
```
App > stegmage > App Configs > Container HTTP Port
Instance Count: 1 (ou plus pour HA)
```

---

## 🚀 Optimisations Production

### 1. Multiple Instances (High Availability)

```
App > stegmage > App Configs
Instance Count: 2 (ou plus)
```

### 2. Redis Persistence

```
App > stegmage-redis > Persistent Directories
/data
```

### 3. Backups Automatiques

```bash
# Script backup (cron sur serveur)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec srv-captain--stegmage tar -czf - /app/uploads /app/results > backup_$DATE.tar.gz
```

### 4. Nettoyage Automatique

Ajouter un cronjob sur le serveur:
```bash
# Supprimer les résultats > 7 jours
0 2 * * * docker exec srv-captain--stegmage find /app/results -type f -mtime +7 -delete
```

---

## ✅ Go Live Checklist

Avant de mettre en production:

- [ ] DNS configuré et propagé
- [ ] HTTPS/SSL actif (cadenas vert)
- [ ] Variables d'environnement production set
- [ ] Redis accessible et persistant
- [ ] Worker tourne et traite les jobs
- [ ] Backup configuré
- [ ] Monitoring actif
- [ ] Logs accessibles
- [ ] Tests de charge effectués
- [ ] Documentation à jour

---

**Prêt pour le déploiement ! 🎉**

Pour toute question: check les logs (`caprover logs -a stegmage`) ou consulter [SECURITY.md](SECURITY.md) pour les aspects sécurité.
