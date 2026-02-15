document.getElementById("upload-form").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("design", document.getElementById("design").files[0]);

    const response = await fetch("/upload", {
        method: "POST",
        body: formData
    });

    const result = await response.json();
    if (result.preview) {
        document.getElementById("preview").innerHTML = `<img src="${result.preview}" alt="Design Preview">`;
    }
});

document.getElementById("payment-form").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const amount = document.getElementById("amount").value;

    const response = await fetch("/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, amount })
    });

    const paymentLink = await response.json();
    window.location.href = paymentLink.data.authorization_url;
});
