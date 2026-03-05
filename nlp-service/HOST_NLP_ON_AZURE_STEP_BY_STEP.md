# Host the NLP service on Azure – step-by-step

Follow these steps in order. You need: an Azure account, your subscription and resource group names, and your GitHub repo.

---

## Step 1: Create Azure Container Registry (ACR)

1. Go to [Azure Portal](https://portal.azure.com) and sign in.
2. Search for **Container Registry** (top search bar) → **Create**.
3. Fill in:
   - **Subscription:** your subscription (e.g. Azure subscription 1).
   - **Resource group:** use the same as your main app (e.g. `reportbuilderpro` or `ReportBuilderPro`). Note the exact name for later.
   - **Registry name:** e.g. `reportbuilderpronlp` (must be unique globally; try your name + “nlp” if taken).
   - **Location:** same as your other resources (e.g. North Europe).
   - **SKU:** Basic.
4. Click **Review + create** → **Create**.
5. When it’s created, open the new registry → left menu **Settings** → **Access keys** → turn **Admin user** to **Enabled**. Leave this tab open; you’ll need the registry name (e.g. `reportbuilderpronlp`) for GitHub secrets.

**Write down:** Resource group name = `________________` , ACR name = `________________` .

---

## Step 2: Create the Container App (placeholder so the workflow can update it)

In Azure Portal, search for **Container Apps** → **Create**. You’ll go through a few screens. Here’s what each one is and what to pick.

---

### Screen 1 – Basics (first page you see)

- **Subscription**  
  Your Azure subscription (e.g. “Azure subscription 1”). Same as the rest of your project.

- **Resource group**  
  The same group as your main app (e.g. `reportbuilderpro` or `ReportBuilderPro`). Use the **exact** name you used for the ACR so everything stays together.

- **Container app name**  
  The name of this app. You’ll use it in GitHub as `AZURE_NLP_CONTAINER_APP_NAME`.  
  Examples: `reportbuilderpro-nlp` or `reportbuilderpronlp`.  
  The red squiggle under the name is usually just a spell-check; Azure doesn’t care. The name must be unique in the region and can only use letters, numbers, and hyphens.

- **Optimize for Azure Functions**  
  Leave this **unchecked**. We’re running a normal container (the NLP API), not Azure Functions.

- **Deployment source**  
  Choose **“Container image”**.  
  That means we’ll give Azure an image (a placeholder now; GitHub will replace it later with your real NLP image).  
  Do **not** choose “Source code or artifact” for this walkthrough.

- **Region**  
  Pick the same region as your other resources (e.g. **West US 2** or **North Europe**). Keeps things simple and fast.

- **Container Apps environment**  
  An “environment” is a boundary that holds one or more container apps.  
  - If you see an existing one (e.g. “managedEnvironment-reportbuilderpr-8c83 (reportbuilderpro)”), you can use that.  
  - Otherwise choose **Create new environment** and give it a name (e.g. same as resource group).  
  You only need one environment for this project.

Then click **Next: Container >**.

---

### Screen 2 – Container (image and resources)

Here you tell Azure **which image** to run. We use a **placeholder** image so the app exists; the GitHub workflow will later replace it with your NLP image.

- **Image source**  
  If it asks where the image comes from, choose **Docker Hub** or **Other public registry** (not your ACR yet—the ACR is empty until the workflow runs).

- **Image and tag**  
  Use a public image so the create can succeed, e.g.:  
  `mcr.microsoft.com/azuredocs/containerapps-helloworld:latest`

- **CPU and memory**  
  Default (e.g. 0.5 CPU, 1 Gi memory) is enough for the NLP service.

Click **Next** until you get to **Ingress**.

---

### Screen 3 – Ingress (how the app is reached from the internet)

Ingress is what gives your NLP service a public URL.

- **Ingress**  
  Turn it **On** / **Enabled**.

- **Accepting traffic from**  
  Choose **Everywhere** or **Accept traffic from anywhere** (external). So your Node backend in Azure can call it.

- **Target port**  
  Set to **8000**. Your NLP app listens on port 8000; Azure will send traffic from the internet to that port.

Then click **Review + create**, check the summary, and click **Create**.

**Write down:** Container App name (exactly as you typed it) = `________________` . You’ll need it for the GitHub secret `AZURE_NLP_CONTAINER_APP_NAME`.

---

## Step 3: Create a service principal (so GitHub can deploy)

You need a service principal and its JSON secret for GitHub.

1. Open **Azure Cloud Shell** in the portal (top bar icon `>_` or search “Cloud Shell”). Use **Bash**.
2. Run this (replace `<SUBSCRIPTION_ID>` and `<RESOURCE_GROUP>` with your real values):

```bash
az account show --query id -o tsv
```

Copy the output; that’s your **Subscription ID**. Then run:

```bash
az ad sp create-for-rbac --name "ReportBuilderPro-GitHub-NLP" --role contributor --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP> --sdk-auth
```

Replace `<SUBSCRIPTION_ID>` and `<RESOURCE_GROUP>` with the values you wrote down (e.g. `reportbuilderpro`).  
You’ll get a **long JSON block** (starts with `{` and has `clientId`, `clientSecret`, `subscriptionId`, etc.). **Copy the entire JSON** (you’ll paste it into GitHub as `AZURE_CREDENTIALS`).

3. Grant this identity permission to push to your ACR. From the JSON you got, copy the value of **`clientId`** (also called `appId`). Then run (replace placeholders):

```bash
az role assignment create --assignee <CLIENT_ID> --role AcrPush --scope /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>/providers/Microsoft.ContainerRegistry/registries/<ACR_NAME>
```

Example: if ACR name is `reportbuilderpronlp`, resource group `reportbuilderpro`, use those. You should see a short JSON output confirming the role assignment.

---

## Step 4: Add GitHub secrets

1. Open your repo on GitHub → **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret** and add these **four** secrets (one at a time):

| Name | Value |
|------|--------|
| `AZURE_CREDENTIALS` | The **entire** JSON from the `az ad sp create-for-rbac ... --sdk-auth` command (Step 3). |
| `AZURE_NLP_RESOURCE_GROUP` | Your resource group name (e.g. `reportbuilderpro`). |
| `AZURE_NLP_ACR_NAME` | Your ACR name **only** (e.g. `reportbuilderpronlp`), no `.azurecr.io`. |
| `AZURE_NLP_CONTAINER_APP_NAME` | Your Container App name (e.g. `reportbuilderpro-nlp`). |

Double-check spelling and that there are no extra spaces. Save each secret.

---

## Step 5: Trigger the NLP deploy from GitHub

1. In your repo, make a small change that touches the NLP service so the workflow runs. For example:
   - Edit `nlp-service/README.md` (add a space or a line), **or**
   - Edit any file under `nlp-service/` (e.g. add a comment in `nlp-service/app/main.py`).
2. Commit and **push to the `main`** branch.
3. On GitHub go to **Actions** → open the workflow **“Deploy NLP Service to Azure”**.
4. You should see a new run. Wait until it completes (green check). If it fails, open the run and read the error message (often a secret name typo or wrong resource group/ACR name).

---

## Step 6: Get the NLP service URL and check health

1. In Azure Portal, go to **Container Apps** and open your app (e.g. `reportbuilderpro-nlp`).
2. On the **Overview** page, find **Application Url** (e.g. `https://reportbuilderpro-nlp.xxxxx.azurecontainerapps.io`). Copy it.
3. In a browser, open: `https://<your-application-url>/health`  
   You should see JSON like: `{"status":"ok","model_loaded":true}`.  
   If you see that, the NLP service is running. If you get an error or `model_loaded: false`, the container may still be starting; wait a minute and try again.

**Write down:** NLP Application URL = `________________` .

---

## Step 7: Point your hosted Node API at the NLP service

1. In Azure Portal, go to **App Services** and open the one that runs your **Node backend** (the API your hosted site uses).
2. In the left menu, click **Configuration** (under Settings).
3. Under **Application settings**, click **+ New application setting** (or edit if `NLP_SERVICE_URL` already exists).
   - **Name:** `NLP_SERVICE_URL`
   - **Value:** the URL from Step 6 (e.g. `https://reportbuilderpro-nlp.xxxxx.azurecontainerapps.io`) with **no trailing slash**.
4. Click **OK**, then **Save** at the top. Confirm when prompted.
5. Restart the App Service: go to **Overview** → **Restart** → confirm.

---

## Step 8: Test on the hosted site

1. Open your **hosted** ReportBuilderPro site (the real URL, not localhost).
2. Log in and go to **Risk Detection**.
3. Upload **TESTINGSitereport1.pdf** (or any PDF with risk/delay/material text).
4. You should see the same kind of results as locally (e.g. 3 findings). If you still see “NLP service not configured”, wait a minute after the restart and try again, or double-check that `NLP_SERVICE_URL` in the Node App Service is exactly the Container App URL and that the Container App `/health` returns `model_loaded: true`.

---

## Quick checklist

- [ ] ACR created; Admin user enabled.
- [ ] Container App created; ingress on port **8000**.
- [ ] Service principal created; `AZURE_CREDENTIALS` JSON copied.
- [ ] AcrPush role assigned to that principal on the ACR.
- [ ] All four GitHub secrets set.
- [ ] Pushed to `main`; “Deploy NLP Service to Azure” workflow green.
- [ ] Container App **Application Url** copied; `/health` returns OK.
- [ ] Node App Service has `NLP_SERVICE_URL` set and has been restarted.
- [ ] Hosted site Risk Detection shows findings (not “NLP service not configured”).

If a step fails, note the exact error (e.g. from GitHub Actions or Azure Portal) and use it to adjust (e.g. wrong secret name, wrong resource group, or missing AcrPush).
