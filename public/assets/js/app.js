const input = document.querySelector('.code-input');
const button = document.querySelector('.btn');
const result = document.querySelector('#result');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getFiles(content) {
  if (!content.file_key) return [];

  try {
    const parsed = JSON.parse(content.file_key);
    if (Array.isArray(parsed)) return parsed;
  } catch {}

  return [{
    file_key: content.file_key,
    display_name: content.file_key.split('/').pop()
  }];
}

async function downloadFile(code, fileKey, button) {
  button.disabled = true;
  button.textContent = 'Préparation...';

  try {
    const response = await fetch(
      `/api/content/${encodeURIComponent(code)}/download?file=${encodeURIComponent(fileKey)}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Téléchargement impossible.');
    }

    window.location.href = data.download_url;
  } catch (error) {
    alert(error.message || 'Téléchargement impossible.');
    button.disabled = false;
    button.textContent = 'Télécharger';
  }
}

button.addEventListener('click', async () => {
  const code = input.value.trim();

  if (!code) {
    result.innerHTML = '<p>Veuillez entrer votre code.</p>';
    result.className = 'result error';
    return;
  }

  button.disabled = true;
  button.textContent = 'Ouverture...';

  try {
    const response = await fetch(
      `/api/content/${encodeURIComponent(code)}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Code invalide.');
    }

    const content = data.content;
    const files = getFiles(content);

    result.innerHTML = `
      <div class="content-card">

        <div class="content-cover">
          ${
            content.cover_url
              ? `<img src="${escapeHtml(content.cover_url)}"
                    alt="${escapeHtml(content.title)}">`
              : '<div class="cover-placeholder">NEXORA</div>'
          }
        </div>

        <div class="content-info">

          <span class="content-type">
            ${escapeHtml(content.type)}
          </span>

          <h2>${escapeHtml(content.title)}</h2>

          ${
            content.description
              ? `<p>${escapeHtml(content.description)}</p>`
              : ''
          }

          <div class="content-files">

            <div class="files-heading">
              <span>CONTENU DISPONIBLE</span>
              <strong>${files.length} fichier${files.length > 1 ? 's' : ''}</strong>
            </div>

            ${
              files.length
                ? files.map((file, index) => `
                    <div class="file-item">
                      <div class="file-meta">
                        <span class="file-number">
                          ${String(index + 1).padStart(2, '0')}
                        </span>

                        <div>
                          <strong>
                            ${escapeHtml(
                              file.display_name ||
                              file.original_name ||
                              `Fichier ${index + 1}`
                            )}
                          </strong>

                          ${
                            file.mime_type
                              ? `<small>${escapeHtml(file.mime_type)}</small>`
                              : ''
                          }
                        </div>
                      </div>

                      <button
                        class="download-btn"
                        data-file-key="${escapeHtml(file.file_key)}"
                      >
                        Télécharger
                      </button>
                    </div>
                  `).join('')
                : '<p>Fichier non disponible.</p>'
            }

          </div>

        </div>
      </div>
    `;

    result.className = 'result success';

    document.querySelectorAll('.download-btn').forEach(downloadButton => {
      downloadButton.addEventListener('click', () => {
        const fileKey = downloadButton.dataset.fileKey;
        downloadFile(code, fileKey, downloadButton);
      });
    });

  } catch (error) {
    result.innerHTML =
      `<p>${escapeHtml(error.message || 'Une erreur est survenue.')}</p>`;
    result.className = 'result error';
  } finally {
    button.disabled = false;
    button.textContent = 'Accéder au contenu';
  }
});
