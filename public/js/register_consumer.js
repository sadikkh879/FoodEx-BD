document.getElementById('consumer-register-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = {
        name: this.name.value.trim(),
        email: this.email.value.trim(),
        password: this.password.value.trim(),
        address: this.address.value.trim()
    };

    try {
        const res = await fetch('/api/auth/register/consumer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const data = await res.json();
        alert(data.message);

        if (res.ok) {
            window.location.href = 'consumer_login.html';
        }
    } catch (err) {
        console.error(err);
        alert('Registration failed!');
    }
});
