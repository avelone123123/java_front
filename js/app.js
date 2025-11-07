// API Base URL
const API_URL = 'http://localhost:8080/api';

// Utility Functions
function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

function isAuthenticated() {
    return !!getToken();
}

function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        setTimeout(() => {
            el.style.display = 'none';
        }, 5000);
    }
}

function showSuccess(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        setTimeout(() => {
            el.style.display = 'none';
        }, 3000);
    }
}

// Auth Functions
async function handleRegister(e) {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showError('errorMessage', 'Пароли не совпадают');
        return;
    }
    
    const data = {
        email: document.getElementById('email').value,
        password: password,
        role: document.getElementById('role').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        phone: document.getElementById('phone').value,
        languagePreference: document.getElementById('language').value
    };
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            setToken(result.token);
            setUser(result);
            showSuccess('successMessage', 'Регистрация успешна! Перенаправление...');
            setTimeout(() => {
                window.location.href = '/profile.html';
            }, 1500);
        } else {
            showError('errorMessage', result.message || 'Ошибка регистрации');
        }
    } catch (error) {
        showError('errorMessage', 'Ошибка подключения к серверу');
        console.error('Register error:', error);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const data = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            setToken(result.token);
            setUser(result);
            showSuccess('successMessage', 'Вход выполнен успешно!');
            setTimeout(() => {
                window.location.href = '/profile.html';
            }, 1000);
        } else {
            showError('errorMessage', result.message || 'Неверный email или пароль');
        }
    } catch (error) {
        showError('errorMessage', 'Ошибка подключения к серверу');
        console.error('Login error:', error);
    }
}

function logout() {
    removeToken();
    window.location.href = '/index.html';
}

function checkAuth() {
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const profileLink = document.getElementById('profileLink');
    const logoutLink = document.getElementById('logoutLink');
    
    if (isAuthenticated()) {
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'block';
        if (logoutLink) logoutLink.style.display = 'block';
    }
}

// Vacancies Functions
async function loadVacancies() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const vacanciesList = document.getElementById('vacanciesList');
    const noVacancies = document.getElementById('noVacancies');
    
    try {
        const response = await fetch(`${API_URL}/vacancies`);
        const vacancies = await response.json();
        
        loadingSpinner.style.display = 'none';
        
        if (vacancies.length === 0) {
            noVacancies.style.display = 'block';
        } else {
            vacancies.forEach(vacancy => {
                vacanciesList.innerHTML += createVacancyCard(vacancy);
            });
        }
        
        const totalVacancies = document.getElementById('totalVacancies');
        if (totalVacancies) {
            totalVacancies.textContent = vacancies.length;
        }
    } catch (error) {
        console.error('Error loading vacancies:', error);
        loadingSpinner.style.display = 'none';
        noVacancies.style.display = 'block';
    }
}

async function searchVacancies() {
    const searchInput = document.getElementById('searchInput').value;
    const vacanciesList = document.getElementById('vacanciesList');
    const noVacancies = document.getElementById('noVacancies');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    loadingSpinner.style.display = 'block';
    vacanciesList.innerHTML = '';
    noVacancies.style.display = 'none';
    
    try {
        const response = await fetch(`${API_URL}/vacancies/search?query=${encodeURIComponent(searchInput)}`);
        const vacancies = await response.json();
        
        loadingSpinner.style.display = 'none';
        
        if (vacancies.length === 0) {
            noVacancies.style.display = 'block';
        } else {
            vacancies.forEach(vacancy => {
                vacanciesList.innerHTML += createVacancyCard(vacancy);
            });
        }
    } catch (error) {
        console.error('Error searching vacancies:', error);
        loadingSpinner.style.display = 'none';
        noVacancies.style.display = 'block';
    }
}

let currentVacancy = null;

function createVacancyCard(vacancy) {
    const skills = vacancy.requiredSkills && Array.isArray(vacancy.requiredSkills) 
        ? vacancy.requiredSkills.map(s => `<span class="skill-tag">${s.trim()}</span>`).join('') 
        : '';
    const salary = vacancy.salaryMin && vacancy.salaryMax 
        ? `${vacancy.salaryMin.toLocaleString()} - ${vacancy.salaryMax.toLocaleString()} ${vacancy.currency || 'KZT'}`
        : 'Не указана';
    
    return `
        <div class="vacancy-card" onclick="openVacancyModal(${vacancy.id})">
            <div class="vacancy-header">
                <div>
                    <h3 class="vacancy-title">${vacancy.titleRu || vacancy.titleEn || vacancy.titleKk}</h3>
                    <p class="vacancy-company">${vacancy.employer?.companyName || 'Компания'}</p>
                </div>
                <span class="vacancy-type">${getVacancyType(vacancy.type)}</span>
            </div>
            <div class="vacancy-details">
                <span class="vacancy-detail">📍 ${vacancy.location}</span>
                <span class="vacancy-detail">💼 ${vacancy.experienceYears || 0} лет опыта</span>
            </div>
            <p class="vacancy-description">${(vacancy.descriptionRu || vacancy.descriptionEn || vacancy.descriptionKk || '').substring(0, 150)}...</p>
            <div class="vacancy-skills">${skills}</div>
            <div class="vacancy-footer">
                <span class="vacancy-salary">${salary}</span>
                <button class="btn-primary" onclick="event.stopPropagation(); openVacancyModal(${vacancy.id})">Подробнее</button>
            </div>
        </div>
    `;
}

async function openVacancyModal(vacancyId) {
    try {
        const response = await fetch(`${API_URL}/vacancies/${vacancyId}`);
        currentVacancy = await response.json();
        
        const modal = document.getElementById('vacancyModal');
        const modalDetails = document.getElementById('modalVacancyDetails');
        const applicationForm = document.getElementById('applicationForm');
        
        const skills = currentVacancy.requiredSkills && Array.isArray(currentVacancy.requiredSkills)
            ? currentVacancy.requiredSkills.map(s => `<span class="skill-tag">${s.trim()}</span>`).join('') 
            : '';
        
        const salary = currentVacancy.salaryMin && currentVacancy.salaryMax 
            ? `${currentVacancy.salaryMin.toLocaleString()} - ${currentVacancy.salaryMax.toLocaleString()} ${currentVacancy.currency || 'KZT'}`
            : 'Не указана';
        
        modalDetails.innerHTML = `
            <h2>${currentVacancy.titleRu || currentVacancy.titleEn || currentVacancy.titleKk}</h2>
            <p style="color: #666; margin-bottom: 1rem;">${currentVacancy.employer?.companyName || 'Компания'}</p>
            
            <div class="modal-info-grid">
                <div>
                    <strong>Тип:</strong> ${getVacancyType(currentVacancy.type)}
                </div>
                <div>
                    <strong>Локация:</strong> ${currentVacancy.location}
                </div>
                <div>
                    <strong>Опыт:</strong> ${currentVacancy.experienceYears || 0} лет
                </div>
                <div>
                    <strong>Зарплата:</strong> ${salary}
                </div>
            </div>
            
            <h3 style="margin-top: 2rem;">Описание</h3>
            <p>${currentVacancy.descriptionRu || currentVacancy.descriptionEn || currentVacancy.descriptionKk}</p>
            
            <h3 style="margin-top: 2rem;">Требуемые навыки</h3>
            <div class="vacancy-skills">${skills}</div>
        `;
        
        // Check if user has already applied
        if (isAuthenticated() && getUser().role !== 'EMPLOYER') {
            const existingApplication = await checkExistingApplication(vacancyId);
            
            if (existingApplication) {
                const statusColors = {
                    'PENDING': '#FFA500',
                    'REVIEWED': '#2196F3',
                    'ACCEPTED': '#4CAF50',
                    'REJECTED': '#F44336'
                };
                
                const statusTexts = {
                    'PENDING': '⏳ Ожидание',
                    'REVIEWED': '👀 Просмотрено',
                    'ACCEPTED': '✅ Принято',
                    'REJECTED': '❌ Отказ'
                };
                
                const statusColor = statusColors[existingApplication.status] || '#666';
                const statusText = statusTexts[existingApplication.status] || existingApplication.status;
                
                applicationForm.innerHTML = `
                    <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin-top: 2rem; text-align: center;">
                        <h3 style="margin: 0 0 1rem 0;">Ваша заявка</h3>
                        <span style="background: ${statusColor}; color: white; padding: 0.75rem 1.5rem; border-radius: 25px; font-size: 1rem; display: inline-block;">
                            ${statusText}
                        </span>
                        <p style="color: var(--text-light); margin-top: 1rem; font-size: 0.9rem;">
                            Подано: ${new Date(existingApplication.appliedAt).toLocaleDateString('ru-RU')}
                        </p>
                    </div>
                `;
                applicationForm.style.display = 'block';
            } else {
                applicationForm.innerHTML = `
                    <h3 style="margin-top: 2rem;">Подать заявку</h3>
                    <textarea id="coverLetter" placeholder="Сопроводительное письмо (необязательно)" style="width: 100%; min-height: 100px; padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; margin: 1rem 0; font-family: inherit;"></textarea>
                    <button class="btn-primary" onclick="submitApplication()" style="width: 100%;">📤 Отправить заявку</button>
                `;
                applicationForm.style.display = 'block';
            }
        } else {
            applicationForm.style.display = 'none';
        }
        
        modal.style.display = 'flex';
    } catch (error) {
        console.error('Error loading vacancy details:', error);
        alert('Ошибка загрузки деталей вакансии');
    }
}

// Check if user has already applied to this vacancy
async function checkExistingApplication(vacancyId) {
    try {
        const response = await fetch(`${API_URL}/applications/my`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            return null;
        }
        
        const applications = await response.json();
        return applications.find(app => app.vacancyId === vacancyId);
    } catch (error) {
        console.error('Error checking existing application:', error);
        return null;
    }
}

function closeVacancyModal() {
    const modal = document.getElementById('vacancyModal');
    modal.style.display = 'none';
    currentVacancy = null;
}

window.onclick = function(event) {
    const modal = document.getElementById('vacancyModal');
    if (event.target == modal) {
        closeVacancyModal();
    }
}

async function submitApplication() {
    if (!currentVacancy) return;
    
    const coverLetterElement = document.getElementById('coverLetter');
    const coverLetter = coverLetterElement ? coverLetterElement.value : '';
    
    try {
        const response = await fetch(`${API_URL}/applications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                vacancyId: currentVacancy.id,
                coverLetter: coverLetter
            })
        });
        
        if (response.ok) {
            alert('Заявка успешно отправлена!');
            // Reload the modal to show the application status
            const vacancyId = currentVacancy.id;
            closeVacancyModal();
            setTimeout(() => {
                openVacancyModal(vacancyId);
            }, 500);
        } else {
            const error = await response.json();
            alert(error.message || 'Ошибка отправки заявки');
        }
    } catch (error) {
        console.error('Error submitting application:', error);
        alert('Ошибка подключения к серверу');
    }
}

function getVacancyType(type) {
    const types = {
        'INTERNSHIP': 'Стажировка',
        'FULL_TIME': 'Полная занятость',
        'PART_TIME': 'Частичная занятость',
        'REMOTE': 'Удаленная работа'
    };
    return types[type] || type;
}

async function fetchVacanciesCount() {
    try {
        const response = await fetch(`${API_URL}/vacancies`);
        const vacancies = await response.json();
        const countElement = document.getElementById('vacanciesCount');
        if (countElement) {
            countElement.textContent = vacancies.length;
        }
    } catch (error) {
        console.error('Error fetching vacancies count:', error);
    }
}

function toggleEditMode() {
    alert('Режим редактирования активен. Внесите изменения и нажмите "Сохранить"');
}

// Profile Functions
async function loadProfile() {
    const loadingProfile = document.getElementById('loadingProfile');
    const profileContent = document.getElementById('profileContent');
    
    try {
        const response = await fetch(`${API_URL}/users/profile`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load profile');
        }
        
        const profile = await response.json();
        const user = getUser();
        
        document.getElementById('userName').textContent = `${user.firstName} ${user.lastName}`;
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('userPhone').textContent = user.phone || 'Не указан';
        document.getElementById('userRole').textContent = user.role === 'STUDENT' ? 'Студент' : user.role === 'GRADUATE' ? 'Выпускник' : 'Работодатель';
        
        if (user.role === 'STUDENT' || user.role === 'GRADUATE') {
            document.getElementById('studentProfile').style.display = 'block';
            loadStudentProfile(profile);
        } else {
            document.getElementById('employerProfile').style.display = 'block';
            loadEmployerProfile(profile);
        }
        
        loadingProfile.style.display = 'none';
        profileContent.style.display = 'block';
    } catch (error) {
        console.error('Error loading profile:', error);
        loadingProfile.innerHTML = '<p>Ошибка загрузки профиля</p>';
    }
}

function loadStudentProfile(profile) {
    // Extract student profile data from nested object
    const studentData = profile.studentProfile || {};
    
    // Always set values, even if empty
    document.getElementById('university').value = studentData.university || '';
    document.getElementById('faculty').value = studentData.faculty || '';
    document.getElementById('specialization').value = studentData.specialization || '';
    document.getElementById('course').value = studentData.course || '';
    document.getElementById('graduationYear').value = studentData.graduationYear || '';
    document.getElementById('gpa').value = studentData.gpa || '';
    
    // Convert skills array to comma-separated string
    if (studentData.skills && Array.isArray(studentData.skills)) {
        document.getElementById('skills').value = studentData.skills.join(', ');
    } else {
        document.getElementById('skills').value = studentData.skills || '';
    }
    
    document.getElementById('bio').value = studentData.bio || '';
    document.getElementById('linkedinUrl').value = studentData.linkedinUrl || '';
    document.getElementById('githubUrl').value = studentData.githubUrl || '';
    
    // Load student's applications
    loadMyApplications();
}

function loadEmployerProfile(profile) {
    // Extract employer profile data from nested object
    const employerData = profile.employerProfile || {};
    
    // Always set values, even if empty
    document.getElementById('companyName').value = employerData.companyName || '';
    document.getElementById('companyDescription').value = employerData.companyDescription || '';
    document.getElementById('industry').value = employerData.industry || '';
    document.getElementById('companySize').value = employerData.companySize || '';
    document.getElementById('website').value = employerData.website || '';
    document.getElementById('address').value = employerData.address || '';
    
    // Load employer's vacancies
    loadEmployerVacancies();
}

// Load student's applications
async function loadMyApplications() {
    const container = document.getElementById('myApplications');
    
    try {
        const response = await fetch(`${API_URL}/applications/my`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load applications');
        }
        
        const applications = await response.json();
        
        if (applications.length === 0) {
            container.innerHTML = '<p style="color: var(--text-light);">У вас пока нет заявок</p>';
            return;
        }
        
        container.innerHTML = applications.map(app => createApplicationCard(app)).join('');
    } catch (error) {
        console.error('Error loading applications:', error);
        container.innerHTML = '<p style="color: var(--error);">Ошибка загрузки заявок</p>';
    }
}

// Create application card for student view
function createApplicationCard(application) {
    const statusColors = {
        'PENDING': '#FFA500',
        'REVIEWED': '#2196F3',
        'ACCEPTED': '#4CAF50',
        'REJECTED': '#F44336'
    };
    
    const statusTexts = {
        'PENDING': '⏳ Ожидание',
        'REVIEWED': '👀 Просмотрено',
        'ACCEPTED': '✅ Принято',
        'REJECTED': '❌ Отказ'
    };
    
    const statusColor = statusColors[application.status] || '#666';
    const statusText = statusTexts[application.status] || application.status;
    
    return `
        <div class="application-card" style="border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; background: white;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 0.5rem 0;">${application.vacancyTitle}</h4>
                    <p style="color: var(--text-light); margin: 0;">🏢 ${application.companyName}</p>
                </div>
                <span style="background: ${statusColor}; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem; white-space: nowrap;">
                    ${statusText}
                </span>
            </div>
            <p style="color: var(--text-light); font-size: 0.9rem; margin: 0.5rem 0;">📅 Подано: ${new Date(application.appliedAt).toLocaleDateString('ru-RU')}</p>
            ${application.coverLetter ? `<p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 1rem;"><strong>Сопроводительное письмо:</strong><br>${application.coverLetter}</p>` : ''}
            ${application.employerMessage ? `
                <div style="background: #f8f9fa; border-left: 4px solid ${statusColor}; padding: 1rem; margin-top: 1rem; border-radius: 4px;">
                    <p style="margin: 0; font-weight: 600; color: var(--text-secondary);">💬 Сообщение от работодателя:</p>
                    <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">${application.employerMessage}</p>
                </div>
            ` : ''}
            ${application.interviewTime ? `
                <div style="background: #e8f5e9; border-left: 4px solid #4CAF50; padding: 1rem; margin-top: 1rem; border-radius: 4px;">
                    <p style="margin: 0; font-weight: 600; color: #2e7d32;">📅 Собеседование назначено:</p>
                    <p style="margin: 0.5rem 0 0 0; color: #2e7d32; font-size: 1.1rem; font-weight: 600;">${new Date(application.interviewTime).toLocaleString('ru-RU', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })}</p>
                </div>
            ` : ''}
        </div>
    `;
}

// Load employer's vacancies with application counts
async function loadEmployerVacancies() {
    const container = document.getElementById('myVacancies');
    
    try {
        const response = await fetch(`${API_URL}/vacancies/my`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load vacancies');
        }
        
        const data = await response.json();
        // Handle paginated response - backend returns Page object with 'content' field
        const vacancies = data.content || data;
        
        if (!vacancies || vacancies.length === 0) {
            container.innerHTML = '<p style="color: var(--text-light);">У вас пока нет вакансий</p>';
            return;
        }
        
        container.innerHTML = vacancies.map(vacancy => createEmployerVacancyCard(vacancy)).join('');
    } catch (error) {
        console.error('Error loading vacancies:', error);
        container.innerHTML = '<p style="color: var(--error);">Ошибка загрузки вакансий</p>';
    }
}

// Create vacancy card for employer view
function createEmployerVacancyCard(vacancy) {
    const title = vacancy.titleRu || vacancy.titleEn || vacancy.titleKk || 'Без названия';
    const safeTitle = title.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    
    return `
        <div class="vacancy-card" style="border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; background: white;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 0.5rem 0;">${title}</h4>
                    <p style="color: var(--text-light); margin: 0.5rem 0;">📍 ${vacancy.location || 'Не указано'} • 💼 ${getVacancyType(vacancy.type)}</p>
                    <p style="color: var(--text-light); font-size: 0.9rem; margin: 0.5rem 0;">📅 Создано: ${new Date(vacancy.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
                <div style="text-align: right;">
                    <span style="background: ${vacancy.isActive ? '#4CAF50' : '#999'}; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem; display: inline-block; margin-bottom: 0.5rem;">
                        ${vacancy.isActive ? '✅ Активна' : '⏸️ Неактивна'}
                    </span>
                </div>
            </div>
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                <button class="btn-primary" style="flex: 1;" onclick="viewVacancyApplications(${vacancy.id}, '${safeTitle}')" data-vacancy-id="${vacancy.id}">👥 Посмотреть заявки</button>
                ${vacancy.isActive ? `<button class="btn-outline" style="color: #F44336; border-color: #F44336;" onclick="deactivateVacancy(${vacancy.id})">🗑️ Деактивировать</button>` : ''}
            </div>
        </div>
    `;
}

// Helper function to decode HTML entities
function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

// View applications for a specific vacancy
async function viewVacancyApplications(vacancyId, vacancyTitle) {
    const modal = document.getElementById('vacancyModal');
    const modalDetails = document.getElementById('modalVacancyDetails');
    
    // Decode HTML entities in title
    const decodedTitle = decodeHtmlEntities(vacancyTitle);
    
    modalDetails.innerHTML = '<div class="loading"><div class="spinner"></div><p>Загрузка заявок...</p></div>';
    modal.style.display = 'flex';
    
    try {
        const response = await fetch(`${API_URL}/applications/vacancy/${vacancyId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load applications');
        }
        
        const applications = await response.json();
        
        if (applications.length === 0) {
            modalDetails.innerHTML = `
                <h2>${decodedTitle}</h2>
                <p style="color: var(--text-light); margin-top: 2rem;">На эту вакансию пока нет заявок</p>
            `;
            return;
        }
        
        modalDetails.innerHTML = `
            <h2>${decodedTitle}</h2>
            <p style="color: var(--text-light); margin-bottom: 2rem;">Всего заявок: ${applications.length}</p>
            <div style="max-height: 500px; overflow-y: auto;">
                ${applications.map(app => createEmployerApplicationCard(app)).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading applications:', error);
        modalDetails.innerHTML = '<p style="color: var(--error);">Ошибка загрузки заявок</p>';
    }
}

// Create application card for employer view
function createEmployerApplicationCard(application) {
    const statusColors = {
        'PENDING': '#FFA500',
        'REVIEWED': '#2196F3',
        'ACCEPTED': '#4CAF50',
        'REJECTED': '#F44336'
    };
    
    const statusTexts = {
        'PENDING': '⏳ Ожидание',
        'REVIEWED': '👀 Просмотрено',
        'ACCEPTED': '✅ Принято',
        'REJECTED': '❌ Отказ'
    };
    
    const statusColor = statusColors[application.status] || '#666';
    const statusText = statusTexts[application.status] || application.status;
    
    return `
        <div class="application-card" style="border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; background: white;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                    <h4 style="margin: 0 0 0.5rem 0;">${application.studentName}</h4>
                    <p style="color: var(--text-light); margin: 0;">📧 ${application.studentEmail}</p>
                    ${application.studentPhone ? `<p style="color: var(--text-light); margin: 0.25rem 0;">📱 ${application.studentPhone}</p>` : ''}
                </div>
                <span style="background: ${statusColor}; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem; white-space: nowrap;">
                    ${statusText}
                </span>
            </div>
            <p style="color: var(--text-light); font-size: 0.9rem; margin: 0.5rem 0;">📅 Подано: ${new Date(application.appliedAt).toLocaleDateString('ru-RU')}</p>
            ${application.coverLetter ? `<p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 1rem;"><strong>Сопроводительное письмо:</strong><br>${application.coverLetter}</p>` : ''}
            ${application.status === 'PENDING' || application.status === 'REVIEWED' ? `
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button class="btn-primary" style="background: #4CAF50; flex: 1;" onclick="openAcceptModal(${application.id}, ${application.vacancyId}, '${application.studentName.replace(/'/g, "\\'")}')">✅ Принять</button>
                    <button class="btn-outline" style="color: #F44336; border-color: #F44336; flex: 1;" onclick="openRejectModal(${application.id}, ${application.vacancyId}, '${application.studentName.replace(/'/g, "\\'")}')">❌ Отклонить</button>
                </div>
            ` : ''}
        </div>
    `;
}

// Variables to store current application being processed
let currentApplicationId = null;
let currentVacancyId = null;

// Open accept modal
function openAcceptModal(applicationId, vacancyId, studentName) {
    currentApplicationId = applicationId;
    currentVacancyId = vacancyId;
    
    // Set default message
    document.getElementById('acceptMessage').value = `Поздравляем, ${studentName}! Мы рады сообщить, что ваша заявка одобрена. Приглашаем вас на собеседование.`;
    document.getElementById('interviewTime').value = '';
    
    document.getElementById('acceptModal').style.display = 'flex';
}

// Close accept modal
function closeAcceptModal() {
    document.getElementById('acceptModal').style.display = 'none';
    currentApplicationId = null;
    currentVacancyId = null;
}

// Open reject modal
function openRejectModal(applicationId, vacancyId, studentName) {
    currentApplicationId = applicationId;
    currentVacancyId = vacancyId;
    
    // Set default message
    document.getElementById('rejectMessage').value = `Уважаемый(-ая) ${studentName}, спасибо за вашу заявку. К сожалению, в данный момент мы не можем продолжить рассмотрение вашей кандидатуры.`;
    
    document.getElementById('rejectModal').style.display = 'flex';
}

// Close reject modal
function closeRejectModal() {
    document.getElementById('rejectModal').style.display = 'none';
    currentApplicationId = null;
    currentVacancyId = null;
}

// Submit accept application
async function submitAcceptApplication(e) {
    e.preventDefault();
    
    const employerMessage = document.getElementById('acceptMessage').value;
    const interviewTime = document.getElementById('interviewTime').value;
    
    if (!employerMessage || !interviewTime) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/applications/${currentApplicationId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ 
                status: 'ACCEPTED',
                employerMessage: employerMessage,
                interviewTime: interviewTime
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update status');
        }
        
        // Close modal
        closeAcceptModal();
        
        // Get the modal title and reload applications
        const modalTitle = document.querySelector('#modalVacancyDetails h2').textContent;
        alert('✅ Кандидат принят! Сообщение и время собеседования отправлены.');
        viewVacancyApplications(currentVacancyId, modalTitle);
    } catch (error) {
        console.error('Error accepting application:', error);
        alert('Ошибка при принятии заявки');
    }
}

// Submit reject application
async function submitRejectApplication(e) {
    e.preventDefault();
    
    const employerMessage = document.getElementById('rejectMessage').value;
    
    try {
        const response = await fetch(`${API_URL}/applications/${currentApplicationId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ 
                status: 'REJECTED',
                employerMessage: employerMessage || null
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update status');
        }
        
        // Close modal
        closeRejectModal();
        
        // Get the modal title and reload applications
        const modalTitle = document.querySelector('#modalVacancyDetails h2').textContent;
        alert('❌ Заявка отклонена. Сообщение отправлено.');
        viewVacancyApplications(currentVacancyId, modalTitle);
    } catch (error) {
        console.error('Error rejecting application:', error);
        alert('Ошибка при отклонении заявки');
    }
}

// Deactivate vacancy
async function deactivateVacancy(vacancyId) {
    if (!confirm('Вы уверены, что хотите деактивировать эту вакансию?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/vacancies/${vacancyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to deactivate vacancy');
        }
        
        alert('✅ Вакансия успешно деактивирована');
        
        // Reload employer vacancies
        loadEmployerVacancies();
    } catch (error) {
        console.error('Error deactivating vacancy:', error);
        alert('Ошибка при деактивации вакансии');
    }
}

// Handle student profile update
async function handleUpdateStudentProfile(e) {
    e.preventDefault();
    
    // Parse skills from comma-separated string to array
    const skillsInput = document.getElementById('skills').value;
    const skillsArray = skillsInput ? skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
    
    const profileData = {
        university: document.getElementById('university').value,
        faculty: document.getElementById('faculty').value,
        specialization: document.getElementById('specialization').value,
        course: parseInt(document.getElementById('course').value) || null,
        graduationYear: parseInt(document.getElementById('graduationYear').value) || null,
        gpa: parseFloat(document.getElementById('gpa').value) || null,
        skills: skillsArray,
        bio: document.getElementById('bio').value,
        linkedinUrl: document.getElementById('linkedinUrl').value,
        githubUrl: document.getElementById('githubUrl').value
    };
    
    try {
        const response = await fetch(`${API_URL}/users/student-profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(profileData)
        });
        
        if (response.ok) {
            alert('Профиль успешно обновлен!');
            // Reload profile to show updated data
            loadProfile();
        } else {
            const error = await response.json();
            alert(error.message || 'Ошибка при обновлении профиля');
        }
    } catch (error) {
        console.error('Error updating student profile:', error);
        alert('Ошибка подключения к серверу');
    }
}

// Handle employer profile update
async function handleUpdateEmployerProfile(e) {
    e.preventDefault();
    
    const profileData = {
        companyName: document.getElementById('companyName').value,
        companyDescription: document.getElementById('companyDescription').value,
        industry: document.getElementById('industry').value,
        companySize: document.getElementById('companySize').value,
        website: document.getElementById('website').value,
        address: document.getElementById('address').value
    };
    
    try {
        const response = await fetch(`${API_URL}/users/employer-profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(profileData)
        });
        
        if (response.ok) {
            alert('Профиль успешно обновлен!');
            // Reload profile to show updated data
            loadProfile();
        } else {
            const error = await response.json();
            alert(error.message || 'Ошибка при обновлении профиля');
        }
    } catch (error) {
        console.error('Error updating employer profile:', error);
        alert('Ошибка подключения к серверу');
    }
}
