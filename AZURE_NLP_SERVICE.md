# Deploy NLP Service to Azure (Container Apps)

The NLP service runs as a **container** on Azure Container Apps. Pushing to `main` (when `nlp-service/` changes) builds the Docker image and deploys it.

---

## One-time Azure setup

### 1. Create Azure Container Registry (ACR)

1. In [Azure Portal](https://portal.azure.com), go to **Create a resource** → **Container Registry**.
2. Use the same **Resource group** as your app (e.g. `ReportBuilderPro`).
3. **Registry name:** e.g. `reportbuilderpronlp` (unique globally).
4. **SKU:** Basic.
5. Create, then open the resource → **Access keys** → enable **Admin user** (or use a service principal with AcrPush).

### 2. Create a service principal (for GitHub Actions)

Run in Azure Cloud Shell or local Azure CLI:

```bash
az ad sp create-for-rbac --name "ReportBuilderPro-GitHub-NLP" --role contributor --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/ReportBuilderPro --sdk-auth
```

Replace `<SUBSCRIPTION_ID>` and `ReportBuilderPro` with your subscription and resource group.  
Grant the same identity **AcrPush** on the ACR (so the workflow can push images):

```bash
az role assignment create --assignee <APP_ID_FROM_ABOVE> --role AcrPush --scope /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/ReportBuilderPro/providers/Microsoft.ContainerRegistry/registries/<ACR_NAME>
```

Copy the JSON output from the first command; you’ll add it as a GitHub secret.

### 3. GitHub secrets

In your repo: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Add:

| Secret name | Description |
|-------------|-------------|
| `AZURE_CREDENTIALS` | Full JSON from the `az ad sp create-for-rbac` command above. |
| `AZURE_NLP_RESOURCE_GROUP` | Resource group name (e.g. `ReportBuilderPro`). |
| `AZURE_NLP_ACR_NAME` | ACR name only (e.g. `reportbuilderpronlp`), not the full `.azurecr.io` URL. |
| `AZURE_NLP_CONTAINER_APP_NAME` | Name for the Container App (e.g. `reportbuilderpro-nlp`). |

If any of these are missing, the workflow will skip the deploy (no failure).

---

## After the first deploy

1. In Azure Portal, open **Container Apps** → your app (e.g. `reportbuilderpro-nlp`).
2. Copy the **Application Url** (e.g. `https://reportbuilderpro-nlp.xxx.azurecontainerapps.io`).
3. In your **backend** App Service (Node API):
   - **Configuration** → **Application settings**
   - Add or edit: `NLP_SERVICE_URL` = `https://reportbuilderpro-nlp.xxx.azurecontainerapps.io` (no trailing slash).
4. Save and restart the API if needed.

Your frontend talks to the Node API; the Node API calls the NLP service using `NLP_SERVICE_URL`, so CORS and auth stay on the backend.

---

## Local Docker run (optional)

```bash
cd nlp-service
docker build -t reportbuilderpro-nlp .
docker run -p 8000:8000 -e PORT=8000 reportbuilderpro-nlp
```

Then set `NLP_SERVICE_URL=http://localhost:8000` for local backend testing.
