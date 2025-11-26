// Global state
let currentUser = null;
let currentEditId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is already logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        showApp();
    } else {
        showAuth();
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            showApp();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            showAuth();
        }
    });

    initializeAuthListeners();
    initializeAppListeners();
});

// ===== AUTHENTICATION =====
function initializeAuthListeners() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const showSignupLink = document.getElementById('showSignup');
    const showLoginLink = document.getElementById('showLogin');

    // Switch between login and signup
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('signupForm').style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
    });

    // Toggle Password Visibility
    const togglePasswordVisibility = (inputId, toggleId) => {
        const input = document.getElementById(inputId);
        const toggleBtn = document.getElementById(toggleId);

        if (toggleBtn && input) {
            toggleBtn.addEventListener('click', () => {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);

                const icon = toggleBtn.querySelector('i');
                if (type === 'password') {
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                } else {
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                }
            });
        }
    };

    togglePasswordVisibility('loginPassword', 'toggleLoginPassword');
    togglePasswordVisibility('signupPassword', 'toggleSignupPassword');

    // Login
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            showToast('Inserisci email e password!', 'error');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accesso...';

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            showToast(error.message, 'error');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span>Accedi</span><i class="fas fa-arrow-right"></i>';
        } else {
            showToast('Accesso effettuato!', 'success');
        }
    });

    // Signup
    signupBtn.addEventListener('click', async () => {
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;

        if (!email || !password) {
            showToast('Inserisci email e password!', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('La password deve essere di almeno 6 caratteri!', 'error');
            return;
        }

        signupBtn.disabled = true;
        signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrazione...';

        const { error } = await supabase.auth.signUp({ email, password });

        if (error) {
            showToast(error.message, 'error');
            signupBtn.disabled = false;
            signupBtn.innerHTML = '<span>Registrati</span><i class="fas fa-user-plus"></i>';
        } else {
            showToast('Registrazione completata! Accedi ora.', 'success');
            setTimeout(() => {
                document.getElementById('signupForm').style.display = 'none';
                document.getElementById('loginForm').style.display = 'block';
                signupBtn.disabled = false;
                signupBtn.innerHTML = '<span>Registrati</span><i class="fas fa-user-plus"></i>';
            }, 1500);
        }
    });
}

// ===== MAIN APP =====
function initializeAppListeners() {
    const addBtn = document.getElementById('addBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const closeModal = document.getElementById('closeModal');
    const cancelEdit = document.getElementById('cancelEdit');
    const saveEdit = document.getElementById('saveEdit');

    // Add Birthday
    addBtn.addEventListener('click', async () => {
        const name = document.getElementById('personName').value.trim();
        const date = document.getElementById('birthDate').value;

        if (!name || !date) {
            showToast('Inserisci nome e data di nascita!', 'error');
            return;
        }

        // Validate date is not in the future
        const birthDate = new Date(date);
        const today = new Date();
        if (birthDate > today) {
            showToast('La data di nascita non può essere nel futuro!', 'error');
            return;
        }

        addBtn.disabled = true;
        addBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aggiunta...';

        const { error } = await supabase
            .from('birthdays')
            .insert([{
                user_id: currentUser.id,
                person_name: name,
                birth_date: date,
                app_type: 'birthday-tracker'
            }]);

        if (error) {
            showToast('Errore: ' + error.message, 'error');
        } else {
            showToast('Compleanno aggiunto!', 'success');
            document.getElementById('personName').value = '';
            document.getElementById('birthDate').value = '';
            loadBirthdays();
        }

        addBtn.disabled = false;
        addBtn.innerHTML = '<i class="fas fa-gift"></i><span>Aggiungi Compleanno</span>';
    });

    // Logout
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        showToast('Disconnesso!', 'success');
    });

    // Delete Account
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    deleteAccountBtn.addEventListener('click', async () => {
        const confirmFirst = confirm('⚠️ ATTENZIONE! Stai per eliminare TUTTI i compleanni salvati in questa app.\n\nIl tuo account rimarrà attivo per altre applicazioni, ma tutti i dati di Birthday Tracker andranno persi.\n\nVuoi continuare?');

        if (!confirmFirst) return;

        const confirmSecond = confirm('🚨 ULTIMA CONFERMA!\n\nSei sicuro di voler cancellare definitivamente tutti i compleanni?');

        if (!confirmSecond) return;

        try {
            // Delete only birthdays for this app
            const { error } = await supabase
                .from('birthdays')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('app_type', 'birthday-tracker');

            if (error) {
                throw error;
            }

            // Sign out after successful deletion
            await supabase.auth.signOut();
            showToast('✅ Dati eliminati con successo!', 'success');
            setTimeout(() => window.location.reload(), 1500);

        } catch (error) {
            console.error('Error deleting data:', error);
            showToast('❌ Errore: ' + error.message, 'error');
        }
    });

    // Delete All Button
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', async () => {
            if (confirm('Sei sicuro di voler eliminare TUTTI i compleanni? Questa azione non può essere annullata.')) {
                await deleteAllBirthdays();
            }
        });
    }

    // Modal controls
    closeModal.addEventListener('click', () => {
        document.getElementById('editModal').classList.remove('active');
    });

    cancelEdit.addEventListener('click', () => {
        document.getElementById('editModal').classList.remove('active');
    });

    // Save Edit
    saveEdit.addEventListener('click', async () => {
        const name = document.getElementById('editPersonName').value.trim();
        const date = document.getElementById('editBirthDate').value;

        if (!name || !date) {
            showToast('Inserisci nome e data!', 'error');
            return;
        }

        saveEdit.disabled = true;
        saveEdit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvataggio...';

        const { error } = await supabase
            .from('birthdays')
            .update({
                person_name: name,
                birth_date: date
            })
            .eq('id', currentEditId)
            .eq('app_type', 'birthday-tracker');

        if (error) {
            showToast('Errore: ' + error.message, 'error');
        } else {
            showToast('Compleanno aggiornato!', 'success');
            document.getElementById('editModal').classList.remove('active');
            loadBirthdays();
        }

        saveEdit.disabled = false;
        saveEdit.innerHTML = '<i class="fas fa-save"></i><span>Salva Modifiche</span>';
    });
}

async function loadBirthdays() {
    const birthdaysList = document.getElementById('birthdaysList');
    const totalCount = document.getElementById('totalCount');

    const { data: birthdays, error } = await supabase
        .from('birthdays')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('app_type', 'birthday-tracker')
        .order('birth_date', { ascending: true });

    if (error) {
        showToast('Errore nel caricamento', 'error');
        return;
    }

    birthdaysList.innerHTML = '';

    if (birthdays.length === 0) {
        birthdaysList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-birthday-cake"></i>
                <p>Nessun compleanno salvato. Aggiungi il primo!</p>
            </div>
        `;
        totalCount.textContent = '0 compleanni';
        return;
    }

    // Cancella regalo e budget per compleanni passati
    await clearPastBirthdayGifts(birthdays);

    // Sort by upcoming birthdays
    const sortedBirthdays = sortByUpcoming(birthdays);
    totalCount.textContent = `${birthdays.length} ${birthdays.length === 1 ? 'compleanno' : 'compleanni'}`;

    sortedBirthdays.forEach(birthday => {
        const card = createBirthdayCard(birthday);
        birthdaysList.appendChild(card);
    });
}

// Cancella regalo e budget per compleanni passati (giorni negativi)
async function clearPastBirthdayGifts(birthdays) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const birthday of birthdays) {
        const daysUntil = getDaysUntilBirthday(birthday.birth_date);

        // Se il compleanno è passato (giorni negativi o 365 = anno scorso)
        // e ci sono dati regalo da cancellare
        if (daysUntil > 300 && (birthday.gift_idea || birthday.budget)) {
            await supabase
                .from('birthdays')
                .update({
                    gift_idea: null,
                    budget: null
                })
                .eq('id', birthday.id)
                .eq('app_type', 'birthday-tracker');

            // Aggiorna l'oggetto locale
            birthday.gift_idea = null;
            birthday.budget = null;
        }
    }
}

function sortByUpcoming(birthdays) {
    return birthdays.sort((a, b) => {
        const daysA = getDaysUntilBirthday(a.birth_date);
        const daysB = getDaysUntilBirthday(b.birth_date);
        return daysA - daysB;
    });
}

// ===== CURRENCY HELPERS =====
const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '';
    return new Intl.NumberFormat('it-IT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

const parseCurrency = (str) => {
    if (!str) return null;
    const cleanStr = str.replace(/\./g, '').replace(',', '.');
    const floatVal = parseFloat(cleanStr);
    return isNaN(floatVal) ? null : floatVal;
};

function createBirthdayCard(birthday) {
    const card = document.createElement('div');
    card.className = 'birthday-item';

    const birthDate = new Date(birthday.birth_date);
    const currentAge = calculateAge(birthday.birth_date);
    const nextAge = currentAge + 1;
    const daysUntil = getDaysUntilBirthday(birthday.birth_date);

    // Add special classes
    if (daysUntil === 0) {
        card.classList.add('today');
    } else if (daysUntil <= 7) {
        card.classList.add('upcoming');
    }

    const formattedDate = birthDate.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long'
    });

    // Capitalize first letter of each word
    const formatName = (name) => {
        return name.toLowerCase().split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    // Format days badge text
    let daysText;
    let daysClass = 'days-text';

    if (daysUntil === 0) {
        daysText = 'OGGI! 🎉';
        daysClass += ' today';
    } else if (daysUntil === 1) {
        daysText = '- Domani!';
    } else {
        daysText = `- tra ${daysUntil} gg`;
    }

    // Helper for safe value
    const safeValue = (val) => val ? escapeHtml(val) : '';

    // HTML Icona Regalo (Emoji) - Visibile se c'è regalo O budget
    const hasGiftData = birthday.gift_idea || birthday.budget;
    const giftIconHtml = `<span class="gift-emoji ${hasGiftData ? 'visible' : ''}">🎁</span>`;

    card.innerHTML = `
        <div class="item-info">
            <div class="item-name">
                ${escapeHtml(formatName(birthday.person_name))}
                ${giftIconHtml}
            </div>
            <div class="item-details">
                <span>${formattedDate}</span>
                <span class="${daysClass}">${daysText}</span>
            </div>
        </div>
        
        <div class="item-right">
            <div class="age-number">${nextAge}</div>
            <div class="age-label">anni</div>
            <div class="item-actions">
                <button class="action-btn share-btn" title="Condividi">
                    <i class="fas fa-share-alt"></i>
                </button>
                <button class="action-btn edit-btn" title="Modifica">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="action-btn delete-btn" title="Elimina">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>

        <!-- Hidden Gift Section -->
        <div class="gift-section">
            <div class="gift-container">
                <div class="gift-input-group main">
                    <label class="gift-label"><i class="fas fa-gift"></i> Idea Regalo</label>
                    <input type="text" class="gift-input gift-idea" placeholder="Cosa vorrebbe ricevere?" value="${safeValue(birthday.gift_idea)}">
                </div>
                <div class="gift-input-group budget">
                    <label class="gift-label"><i class="fas fa-euro-sign"></i> Budget</label>
                    <input type="text" class="gift-input gift-budget" placeholder="0,00" value="${formatCurrency(birthday.budget)}">
                </div>
            </div>
        </div>
    `;

    // Toggle Expansion Logic
    card.addEventListener('click', (e) => {
        if (e.target.closest('.item-actions') || e.target.closest('.gift-input')) return;

        document.querySelectorAll('.birthday-item.expanded').forEach(item => {
            if (item !== card) item.classList.remove('expanded');
        });

        card.classList.toggle('expanded');
    });

    // Auto-save Logic for Gift & Budget
    const giftInput = card.querySelector('.gift-idea');
    const budgetInput = card.querySelector('.gift-budget');
    const giftEmoji = card.querySelector('.gift-emoji');

    // Budget Input Formatting Logic
    budgetInput.addEventListener('focus', () => {
        const val = parseCurrency(budgetInput.value);
        if (val !== null) {
            budgetInput.value = val.toString().replace('.', ',');
        } else {
            budgetInput.value = '';
        }
        budgetInput.select();
    });

    // Save on Blur
    const saveGiftData = async () => {
        const giftIdea = giftInput.value.trim();

        let budgetVal = null;
        if (budgetInput.value.trim() !== '') {
            let rawVal = budgetInput.value.replace(/\./g, '').replace(',', '.');
            budgetVal = parseFloat(rawVal);
            if (isNaN(budgetVal)) budgetVal = null;
        }

        budgetInput.value = formatCurrency(budgetVal);

        // Update Icon Visibility - Mostra se c'è regalo O budget
        if (giftIdea || budgetVal) {
            giftEmoji.classList.add('visible');
        } else {
            giftEmoji.classList.remove('visible');
        }

        const { error } = await supabase
            .from('birthdays')
            .update({
                gift_idea: giftIdea || null,
                budget: budgetVal
            })
            .eq('id', birthday.id)
            .eq('app_type', 'birthday-tracker');

        if (error) {
            console.error('Error saving gift data:', error);
            showToast('Errore nel salvataggio dati', 'error');
        }
    };

    giftInput.addEventListener('blur', saveGiftData);
    budgetInput.addEventListener('blur', saveGiftData);

    giftInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') giftInput.blur(); });
    budgetInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') budgetInput.blur(); });

    // Share button
    const shareBtn = card.querySelector('.share-btn');
    shareBtn.addEventListener('click', async () => {
        const shareText = `🎂 Compleanno di ${formatName(birthday.person_name)}
📅 Data: ${formattedDate}
🎉 Compie: ${nextAge} anni!
        
Non dimenticare di fare gli auguri!`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Promemoria Compleanno',
                    text: shareText,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            copyToClipboard(shareText);
            showToast('Testo copiato negli appunti!', 'success');
        }
    });

    // Edit button
    const editBtn = card.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => {
        currentEditId = birthday.id;
        document.getElementById('editPersonName').value = birthday.person_name;
        document.getElementById('editBirthDate').value = birthday.birth_date;
        document.getElementById('editModal').classList.add('active');
    });

    // Delete button
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', async () => {
        if (confirm(`Sei sicuro di voler eliminare il compleanno di ${birthday.person_name}?`)) {
            const { error } = await supabase
                .from('birthdays')
                .delete()
                .eq('id', birthday.id)
                .eq('app_type', 'birthday-tracker');

            if (error) {
                showToast('Errore durante l\'eliminazione', 'error');
            } else {
                showToast('Compleanno eliminato!', 'success');
                loadBirthdays();
            }
        }
    });

    return card;
}

// ===== UTILITY FUNCTIONS =====
function calculateAge(birthDate) {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

function getDaysUntilBirthday(birthDate) {
    const birth = new Date(birthDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisYearBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    thisYearBirthday.setHours(0, 0, 0, 0);

    if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = thisYearBirthday - today;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

function showAuth() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

function showApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('footerEmail').textContent = currentUser.email;
    loadBirthdays();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

async function deleteAllBirthdays() {
    if (!currentUser) {
        showToast('Errore: utente non autenticato', 'error');
        return;
    }

    const { error } = await supabase
        .from('birthdays')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('app_type', 'birthday-tracker');

    if (error) {
        showToast('Errore durante l\'eliminazione: ' + error.message, 'error');
    } else {
        showToast('Tutti i compleanni sono stati eliminati!', 'success');
        loadBirthdays();
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Dati copiati negli appunti!', 'success');
        }).catch(() => {
            showToast('Impossibile copiare i dati', 'error');
        });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('Dati copiati negli appunti!', 'success');
        } catch (err) {
            showToast('Impossibile copiare i dati', 'error');
        }
        document.body.removeChild(textArea);
    }
}
