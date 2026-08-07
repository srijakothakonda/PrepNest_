const config = {
    task: {
        title: 'Task manager',
        subtitle: 'Organize every task for a calmer, more focused day.',
        add: 'Add task',
        name: 'title',
        fields: [
            ['title', 'Task title', 'text'],
            ['description', 'Description', 'text'],
            ['priority', 'Priority', 'select:Low|Medium|High'],
            ['deadline', 'Deadline', 'datetime-local'],
            ['estimated_time', 'Estimated time', 'text'],
            ['category', 'Category', 'text'],
            ['status', 'Status', 'select:Pending|In Progress|Completed']
        ]
    },

    revision: {
        title: 'Revision planner',
        subtitle: 'Schedule the subjects you want to remember for longer.',
        add: 'Add revision',
        name: 'topic',
        fields: [
            ['topic', 'Topic', 'text'],
            ['description', 'Description', 'text'],
            ['revision_date', 'Revision date', 'date'],
            ['priority', 'Priority', 'select:Low|Medium|High'],
            ['status', 'Status', 'select:Pending|Completed'],
            ['notes', 'Notes', 'text']
        ]
    },

    reminder: {
        title: 'Reminders',
        subtitle: 'Gentle nudges for the study sessions that matter.',
        add: 'Add reminder',
        name: 'title',
        fields: [
            ['title', 'Reminder title', 'text'],
            ['message', 'Message', 'text'],
            ['reminder_date', 'Date', 'date'],
            ['reminder_time', 'Time', 'time'],
            ['status', 'Status', 'select:Pending|Sent']
        ]
    }
};

let type;
let items = [];

const esc = s =>
    String(s || '').replace(
        /[&<>]/g,
        c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        }[c])
    );


// ======================================================
// PAGE LOAD
// ======================================================

document.addEventListener('DOMContentLoaded', async () => {

    type = document.body.dataset.module;

    const c = config[type];

    document.body.innerHTML = layout(
        type,
        `
        <div class="title-row">
            <div>
                <h1 class="page-title">${c.title}</h1>
                <p class="subtle">${c.subtitle}</p>
            </div>

            <button class="button" onclick="openModal()">
                ＋ ${c.add}
            </button>
        </div>

        <div class="toolbar">

            <input
                class="search"
                placeholder="Search ${type}s..."
                oninput="render()"
            >

            <select onchange="render()" id="filter">
                <option value="">All statuses</option>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Sent</option>
            </select>

        </div>

        <section class="table-card">

            <div class="item-row header">

                <span>
                    ${type === 'revision' ? 'Topic' : 'Title'}
                </span>

                <span>
                    Priority / date
                </span>

                <span>
                    Status
                </span>

                <span>
                    Details
                </span>

                <span>
                    Actions
                </span>

            </div>

            <div id="list"></div>

        </section>

        <div class="modal" id="modal">

            <div class="modal-box">

                <h2 id="modalTitle">
                    ${c.add}
                </h2>

                <form id="editor">

                    <div
                        class="form-grid"
                        id="fields">
                    </div>

                    <div class="form-actions">

                        <button
                            type="button"
                            class="button ghost"
                            onclick="closeModal()">
                            Cancel
                        </button>

                        <button class="button">
                            Save ${type}
                        </button>

                    </div>

                </form>

            </div>

        </div>
        `
    );

    await hydrateUser();

    render();
});


// ======================================================
// RENDER
// ======================================================

async function render() {

    items = await API.get('/' + type);

    const q =
        document
            .querySelector('.search')
            .value
            .toLowerCase();

    const f =
        document.querySelector('#filter').value;

    const c = config[type];

    const rows = items.filter(
        i =>
            String(i[c.name])
                .toLowerCase()
                .includes(q)
            &&
            (!f || i.status === f)
    );

    document.querySelector('#list').innerHTML =
        rows.length
            ?

            rows.map(i => `

                <div class="item-row">

                    <div>

                        <strong>
                            ${esc(i[c.name])}
                        </strong>

                        <small>
                            ${esc(
                                i.description ||
                                i.message ||
                                i.notes ||
                                'No description'
                            )}
                        </small>

                    </div>

                    <div>

                        <span
                            class="tag ${
                                i.priority === 'High'
                                    ? 'high'
                                    : ''
                            }">

                            ${
                                i.priority ||
                                i.revision_date ||
                                i.reminder_date ||
                                '—'
                            }

                        </span>

                    </div>

                    <div>

                        <span
                            class="tag ${
                                i.status === 'Completed' ||
                                i.status === 'Sent'
                                    ? 'done'
                                    : ''
                            }">

                            ${i.status}

                        </span>

                    </div>

                    <div>

                        ${
                            i.deadline
                                ? new Date(
                                    i.deadline
                                  ).toLocaleDateString()

                                : i.estimated_time ||

                                  i.reminder_time ||

                                  '—'
                        }

                    </div>

                    <div class="actions">

                        <button
                            class="icon-btn"
                            onclick="editItem(${i.id})">
                            ✎
                        </button>

                        <button
                            class="icon-btn"
                            onclick="removeItem(${i.id})">
                            ⌫
                        </button>

                    </div>

                </div>

            `).join('')

            :

            `
            <div class="empty">
                No ${type}s yet. Add one to get started.
            </div>
            `;
}


// ======================================================
// OPEN MODAL
// ======================================================

function openModal(item) {

    const c = config[type];

    document
        .querySelector('#modal')
        .classList
        .add('open');

    document
        .querySelector('#modalTitle')
        .textContent =
            item
                ? 'Edit ' + type
                : c.add;

    document
        .querySelector('#editor')
        .dataset.id =
            item?.id || '';

    document
        .querySelector('#fields')
        .innerHTML =

        c.fields.map(
            ([key, label, kind]) => {

                let input;

                if (kind.startsWith('select:')) {

                    input = `
                        <select name="${key}">

                            ${
                                kind
                                    .slice(7)
                                    .split('|')
                                    .map(
                                        v => `
                                        <option
                                            ${
                                                item?.[key] === v
                                                    ? 'selected'
                                                    : ''
                                            }>
                                            ${v}
                                        </option>
                                        `
                                    )
                                    .join('')
                            }

                        </select>
                    `;

                } else {

                    input = `
                        <input
                            name="${key}"
                            type="${kind}"
                            value="${esc(
                                item?.[key] || ''
                            )}"
                            ${
                                key === c.name
                                    ? 'required'
                                    : ''
                            }
                        >
                    `;
                }

                return `

                    <label
                        class="${
                            key === 'description' ||
                            key === 'message' ||
                            key === 'notes'
                                ? 'full'
                                : ''
                        }">

                        ${label}

                        ${input}

                    </label>

                `;
            }
        ).join('');
}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeModal() {

    document
        .querySelector('#modal')
        .classList
        .remove('open');
}


// ======================================================
// EDIT
// ======================================================

function editItem(id) {

    openModal(
        items.find(i => i.id === id)
    );
}


// ======================================================
// DELETE
// ======================================================

async function removeItem(id) {

    if (confirm('Delete this item?')) {

        await API.delete(
            '/' + type + '/' + id
        );

        toast('Deleted');

        render();
    }
}


// ======================================================
// SAVE
// ======================================================

document.addEventListener(
    'submit',
    async e => {

        if (e.target.id !== 'editor')
            return;

        e.preventDefault();

       const data =
    Object.fromEntries(
        new FormData(e.target)
    );

console.log("Saving:", data);

if (type === 'reminder') {
    data.status = 'Pending';
}

        const id =
            e.target.dataset.id;

        if (id) {

            await API.put(
                '/' + type + '/' + id,
                data
            );

        } else {

            await API.post(
                '/' + type,
                data
            );
        }

        closeModal();

        toast('Saved');

        render();
    }
);


// ======================================================
// REMINDER NOTIFICATIONS
// ======================================================

async function enableNotifications() {

    // Check browser support
    if (!('Notification' in window)) {

        alert(
            'This browser does not support notifications.'
        );

        return;
    }


    // Ask for notification permission
    if (Notification.permission === 'default') {

        await Notification.requestPermission();
    }


    // Permission denied
    if (Notification.permission !== 'granted') {

        console.log(
            'Notification permission denied.'
        );

        return;
    }


    // Function to check reminders
    const check = async () => {

        try {

            const reminders =
                await API.get('/reminder');

            const now = new Date();


            for (const r of reminders) {

                // Only Pending reminders
                if (r.status !== 'Pending') {
                    continue;
                }


                // ==========================================
                // GET DATE
                // ==========================================

                let dateString =
                    String(r.reminder_date);


                /*
                 * Backend may return:
                 *
                 * 2026-08-04T18:30:00.000Z
                 *
                 * OR:
                 *
                 * 2026-08-05
                 *
                 * We take only YYYY-MM-DD.
                 */

                if (dateString.includes('T')) {

                    dateString =
                        dateString.split('T')[0];
                }


                // ==========================================
                // GET TIME
                // ==========================================

                let timeString =
                    String(r.reminder_time);


                /*
                 * Examples:
                 *
                 * 23:05
                 * 23:05:00
                 */

                const timeParts =
                    timeString.split(':');


                const hour =
                    Number(timeParts[0]);

                const minute =
                    Number(timeParts[1]);


                // ==========================================
                // GET YEAR / MONTH / DAY
                // ==========================================

                const dateParts =
                    dateString.split('-');


                const year =
                    Number(dateParts[0]);

                const month =
                    Number(dateParts[1]);

                const day =
                    Number(dateParts[2]);


                // ==========================================
                // CREATE LOCAL DATE
                // ==========================================

                const reminderDate =
                    new Date(
                        year,
                        month - 1,
                        day,
                        hour,
                        minute,
                        0
                    );


                // ==========================================
                // DEBUG
                // ==========================================

                console.log(
                    'Current time:',
                    now.toLocaleString()
                );

                console.log(
                    'Database date:',
                    r.reminder_date
                );

                console.log(
                    'Database time:',
                    r.reminder_time
                );

                console.log(
                    'Reminder time:',
                    reminderDate.toLocaleString()
                );


                // ==========================================
                // CHECK INVALID DATE
                // ==========================================

                if (
                    isNaN(
                        reminderDate.getTime()
                    )
                ) {

                    console.error(
                        'Invalid reminder:',
                        r
                    );

                    continue;
                }


                // ==========================================
                // CHECK REMINDER TIME
                // ==========================================

                if (
                    reminderDate <= now
                ) {

                    console.log(
                        '🔔 REMINDER TRIGGERED:',
                        r.title
                    );


                    // ======================================
                    // SHOW BROWSER NOTIFICATION
                    // ======================================

                    new Notification(
                        'PrepNest - ' + r.title,
                        {
                            body:
                                r.message ||
                                'Time for your planned study session.'
                        }
                    );


                    // ======================================
                    // CHANGE STATUS
                    // Pending -> Sent
                    // ======================================

                    await API.put(
                        '/reminder/' + r.id,
                        {
                            status: 'Sent'
                        }
                    );


                    // ======================================
                    // SHOW TOAST
                    // ======================================

                    toast(
                        'Reminder sent: ' +
                        r.title
                    );


                    // ======================================
                    // REFRESH LIST
                    // ======================================

                    render();
                }
            }

        } catch (error) {

            console.error(
                'Reminder check failed:',
                error
            );
        }
    };


    // Check immediately
    check();


    // Check every 10 seconds
    setInterval(
        check,
        10000
    );
}


// ======================================================
// START REMINDER NOTIFICATIONS
// ======================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        if (
            document.body.dataset.module ===
            'reminder'
        ) {

            enableNotifications();
        }
    }
);