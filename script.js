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
        } else if (event === 'PASSWORD_RECOVERY') {
            // User clicked the reset link in email
            showUpdatePasswordForm();
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

    // Recovery elements
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const sendRecoveryBtn = document.getElementById('sendRecoveryBtn');
    const backToLoginFromRecovery = document.getElementById('backToLoginFromRecovery');
    const updatePasswordBtn = document.getElementById('updatePasswordBtn');

    // Switch between login and signup
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllForms();
        document.getElementById('signupForm').style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllForms();
        document.getElementById('loginForm').style.display = 'block';
    });

    // Forgot Password Flow
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllForms();
        document.getElementById('recoveryForm').style.display = 'block';
    });

    backToLoginFromRecovery.addEventListener('click', (e) => {
        e.preventDefault();
        hideAllForms();
        document.getElementById('loginForm').style.display = 'block';
    });

    // Send Recovery Email
    sendRecoveryBtn.addEventListener('click', async () => {
        const email = document.getElementById('recoveryEmail').value.trim();

        if (!email) {
            showToast('Inserisci la tua email!', 'error');
            return;
        }

        sendRecoveryBtn.disabled = true;
        sendRecoveryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Invio...';

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.href, // Redirect back to this page
        });

        if (error) {
            showToast(error.message, 'error');
            sendRecoveryBtn.disabled = false;
            sendRecoveryBtn.innerHTML = '<span>Invia Link di Reset</span><i class="fas fa-paper-plane"></i>';
        } else {
            showToast('Link inviato! Controlla la tua email.', 'success');
            setTimeout(() => {
                hideAllForms();
                document.getElementById('loginForm').style.display = 'block';
                sendRecoveryBtn.disabled = false;
                sendRecoveryBtn.innerHTML = '<span>Invia Link di Reset</span><i class="fas fa-paper-plane"></i>';
            }, 3000);
        }
    });

    // Update Password (after clicking link in email)
    updatePasswordBtn.addEventListener('click', async () => {
        const newPassword = document.getElementById('newPassword').value;

        if (!newPassword || newPassword.length < 6) {
            showToast('La password deve essere di almeno 6 caratteri!', 'error');
            return;
        }

        updatePasswordBtn.disabled = true;
        updatePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aggiornamento...';

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            showToast(error.message, 'error');
            updatePasswordBtn.disabled = false;
            updatePasswordBtn.innerHTML = '<span>Aggiorna Password</span><i class="fas fa-save"></i>';
        } else {
            showToast('Password aggiornata con successo!', 'success');
            setTimeout(() => {
                window.location.reload(); // Reload to clear URL fragments and show app
            }, 1500);
        }
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
    togglePasswordVisibility('newPassword', 'toggleNewPassword');

    // Calendar Icon - Trigger Date Picker
    const calendarBtn = document.getElementById('calendarBtn');
    if (calendarBtn) {
        calendarBtn.addEventListener('click', () => {
            const birthDateInput = document.getElementById('birthDate');
            if (birthDateInput) {
                if ('showPicker' in HTMLInputElement.prototype) {
                    birthDateInput.showPicker();
                } else {
                    birthDateInput.click();
                }
            }
        });
    }

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
                hideAllForms();
                document.getElementById('loginForm').style.display = 'block';
                signupBtn.disabled = false;
                signupBtn.innerHTML = '<span>Registrati</span><i class="fas fa-user-plus"></i>';
            }, 1500);
        }
    });
}

function hideAllForms() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('recoveryForm').style.display = 'none';
    document.getElementById('updatePasswordForm').style.display = 'none';
}

function showUpdatePasswordForm() {
    hideAllForms();
    document.getElementById('updatePasswordForm').style.display = 'block';
    // Ensure auth container is visible if we are somehow in app mode
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
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

// ===== DATA MANAGEMENT =====
async function loadBirthdays() {
    const list = document.getElementById('birthdaysList');
    const totalCount = document.getElementById('totalCount');

    list.innerHTML = '<div style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #ff6b9d;"></i></div>';

    const { data: birthdays, error } = await supabase
        .from('birthdays')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('app_type', 'birthday-tracker')
        .order('birth_date', { ascending: true });

    if (error) {
        showToast('Errore caricamento: ' + error.message, 'error');
        return;
    }

    list.innerHTML = '';

    if (birthdays.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-birthday-cake" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                <p>Nessun compleanno salvato.</p>
                <p style="font-size: 0.9rem;">Aggiungine uno per iniziare!</p>
            </div>
        `;
        totalCount.textContent = '0 compleanni';
        return;
    }

    totalCount.textContent = `${birthdays.length} compleanni`;

    // Process and sort birthdays by next occurrence
    const processedBirthdays = birthdays.map(birthday => {
        const birthDate = new Date(birthday.birth_date);
        const today = new Date();

        let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());

        if (nextBirthday < today && nextBirthday.toDateString() !== today.toDateString()) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
        }

        const diffTime = nextBirthday - today;
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const age = nextBirthday.getFullYear() - birthDate.getFullYear();

        return {
            ...birthday,
            daysUntil,
            age,
            nextBirthday
        };
    }).sort((a, b) => a.daysUntil - b.daysUntil);

    processedBirthdays.forEach(birthday => {
        const isToday = birthday.daysUntil === 0;
        const isUpcoming = birthday.daysUntil > 0 && birthday.daysUntil <= 7;

        const item = document.createElement('div');
        item.className = `birthday-item ${isToday ? 'today' : ''} ${isUpcoming ? 'upcoming' : ''}`;

        // Format date
        const dateOptions = { day: 'numeric', month: 'long' };
        const formattedDate = new Date(birthday.birth_date).toLocaleDateString('it-IT', dateOptions);

        let daysText = '';
        if (isToday) {
            daysText = '<span class="days-text today">OGGI! 🎉</span>';
        } else if (birthday.daysUntil === 1) {
            daysText = '<span class="days-text">Domani!</span>';
        } else {
            daysText = `<span class="days-text">tra ${birthday.daysUntil} giorni</span>`;
        }

        item.innerHTML = `
            <div class="item-info" onclick="toggleGiftSection('${birthday.id}')">
                <div class="item-name">
                    ${birthday.person_name}
                    <i class="fas fa-gift gift-emoji ${birthday.gift_idea ? 'visible' : ''}" title="Idea regalo salvata"></i>
                </div>
                <div class="item-details">
                    <i class="far fa-calendar-alt"></i>
                    <span>${formattedDate}</span>
                    • ${daysText}
                </div>
                
                <!-- Gift Section (Hidden by default) -->
                <div id="gift-section-${birthday.id}" class="gift-section" onclick="event.stopPropagation()">
                    <div class="gift-container">
                        <div class="gift-input-group main">
                            <label class="gift-label"><i class="fas fa-gift"></i> Idea Regalo</label>
                            <input type="text" 
                                class="gift-input" 
                                id="gift-idea-${birthday.id}" 
                                placeholder="Cosa regalare?" 
                                value="${birthday.gift_idea || ''}"
                                onchange="saveGiftIdea('${birthday.id}')">
                        </div>
                        <div class="gift-input-group budget">
                            <label class="gift-label"><i class="fas fa-euro-sign"></i> Budget</label>
                            <input type="number" 
                                class="gift-input" 
                                id="gift-budget-${birthday.id}" 
                                placeholder="0.00" 
                                value="${birthday.gift_budget || ''}"
                                onchange="saveGiftIdea('${birthday.id}')">
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="item-right">
                <div class="age-label">Compie</div>
                <div class="age-number">${birthday.age}</div>
                <div class="age-label">Anni</div>
            </div>

            <div class="item-actions">
                <button class="action-btn btn-share" onclick="shareBirthday('${birthday.person_name}', ${birthday.age}, '${formattedDate}')" title="Condividi">
                    <i class="fas fa-share-alt"></i>
                </button>
                <button class="action-btn btn-edit" onclick="editBirthday('${birthday.id}', '${birthday.person_name}', '${birthday.birth_date}')" title="Modifica">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn btn-delete" onclick="deleteBirthday('${birthday.id}')" title="Elimina">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        list.appendChild(item);
    });
}

async function deleteBirthday(id) {
    if (!confirm('Sei sicuro di voler eliminare questo compleanno?')) return;

    const { error } = await supabase
        .from('birthdays')
        .delete()
        .eq('id', id)
        .eq('app_type', 'birthday-tracker');

    if (error) {
        showToast('Errore: ' + error.message, 'error');
    } else {
        showToast('Eliminato!', 'success');
        loadBirthdays();
    }
}

async function deleteAllBirthdays() {
    const { error } = await supabase
        .from('birthdays')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('app_type', 'birthday-tracker');

    if (error) {
        showToast('Errore: ' + error.message, 'error');
    } else {
        showToast('Tutti i compleanni eliminati!', 'success');
        loadBirthdays();
    }
}

function editBirthday(id, name, date) {
    currentEditId = id;
    document.getElementById('editPersonName').value = name;
    document.getElementById('editBirthDate').value = date;
    document.getElementById('editModal').classList.add('active');
}

function shareBirthday(name, age, date) {
    const text = `🎂 Non dimenticare! ${name} compie ${age} anni il ${date}. Salvato su Birthday Tracker!`;
    if (navigator.share) {
        navigator.share({
            title: 'Compleanno in arrivo!',
            text: text,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(text);
        showToast('Testo copiato negli appunti!', 'success');
    }
}

// ===== GIFT FUNCTIONALITY =====
function toggleGiftSection(id) {
    const item = document.getElementById(`gift-section-${id}`).closest('.birthday-item');
    item.classList.toggle('expanded');
}

async function saveGiftIdea(id) {
    const idea = document.getElementById(`gift-idea-${id}`).value;
    const budget = document.getElementById(`gift-budget-${id}`).value;

    // Update UI immediately (optimistic update)
    const item = document.getElementById(`gift-section-${id}`).closest('.birthday-item');
    const emoji = item.querySelector('.gift-emoji');

    if (idea || budget) {
        emoji.classList.add('visible');
    } else {
        emoji.classList.remove('visible');
    }

    const { error } = await supabase
        .from('birthdays')
        .update({
            gift_idea: idea,
            gift_budget: budget ? parseFloat(budget) : null
        })
        .eq('id', id)
        .eq('app_type', 'birthday-tracker');

    if (error) {
        showToast('Errore salvataggio regalo', 'error');
    } else {
        // Optional: show a small success indicator
    }
}

// ===== UI HELPERS =====
function showApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    document.getElementById('footerEmail').textContent = currentUser.email;
    loadBirthdays();
}

function showAuth() {
    document.getElementById('appContainer').style.display = 'none';
    document.getElementById('authContainer').style.display = 'flex';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '10px';
    toast.style.color = 'white';
    toast.style.fontWeight = '600';
    toast.style.zIndex = '10000';
    toast.style.animation = 'slideIn 0.3s, fadeOut 0.3s 2.7s';
    toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
    toast.style.backdropFilter = 'blur(10px)';

    if (type === 'error') {
        toast.style.background = 'rgba(239, 68, 68, 0.9)';
        toast.style.border = '1px solid rgba(239, 68, 68, 0.5)';
        toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    } else if (type === 'success') {
        toast.style.background = 'rgba(34, 197, 94, 0.9)';
        toast.style.border = '1px solid rgba(34, 197, 94, 0.5)';
        toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    } else {
        toast.style.background = 'rgba(59, 130, 246, 0.9)';
        toast.style.border = '1px solid rgba(59, 130, 246, 0.5)';
        toast.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    }

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Add CSS for toast animation
const style = document.createElement('style');
style.innerHTML = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);
