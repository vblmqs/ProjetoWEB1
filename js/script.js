let produtos = [];
let produtoEditando = null; // Variável para armazenar o ID do produto sendo editado

const baseURL = "http://localhost:3000/produtos"; // Substitua com a URL correta do seu backend

async function fetchProdutos() {
    try {
        const response = await fetch(baseURL);
        const data = await response.json();
        console.log("Dados recebidos da API:", data);
        produtos = Array.isArray(data) ? data : [data];
        console.log("Produtos após ajuste:", produtos);
        renderProductList();
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
    }
}

async function fetchAddProduto(produto) {
    const response = await fetch(baseURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(produto),
    });
    return response.json();
}

async function fetchUpdateProduto(id, produto) {
    const response = await fetch(`${baseURL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(produto),
    });
    return response.json();
}

async function fetchDeleteProduto(id) {
    try {
        const response = await fetch(`${baseURL}/${id}`, {
            method: "DELETE",
        });
        if (response.ok) {
            console.log("Produto deletado com sucesso");
            fetchProdutos();
        } else {
            console.error("Erro ao deletar produto");
        }
    } catch (error) {
        console.error("Erro ao deletar produto:", error);
    }
}

function renderProductList() {
    console.log("Renderizando lista de produtos:", produtos);
    const lista = document.getElementById("product-list");
    lista.innerHTML = "";
    produtos.forEach((produto, index) => {
        console.log("Renderizando produto:", produto);
        const produtoDiv = document.createElement("div");
        produtoDiv.classList.add("product-card");
        produtoDiv.innerHTML = `
            <h3>${produto.descricao}</h3>
            <p>Valor: R$ ${produto.valor.replace(".", ",")}</p>
            <p>Categoria: ${produto.categoria}</p>
            <div class="actions">
                <button class="edit-btn" onclick="editProduct(${produto.id})">✏️</button>
                <button class="delete-btn" onclick="deleteProduct(${produto.id})">🗑️</button>
            </div>
        `;
        lista.appendChild(produtoDiv);
    });
}

function editProduct(id) {
    produtoEditando = id;
    const produto = produtos.find(p => p.id === id);
    document.getElementById("product-description").value = produto.descricao;
    document.getElementById("product-description").disabled = true; // Desabilitar a edição da descrição
    document.getElementById("product-value").value = produto.valor.replace(".", ",");
    document.getElementById("product-category").value = produto.categoria;
    if (produto.categoria === "outros") {
        document.getElementById("other-category-container").style.display = "block";
        document.getElementById("other-category").value = produto.categoria;
    } else {
        document.getElementById("other-category-container").style.display = "none";
    }
    showForm();
}

async function deleteProduct(id) {
    if (confirm("Tem certeza que deseja deletar este produto?")) {
        await fetchDeleteProduto(id);
    }
}

function showForm() {
    document.getElementById("product-form-container").style.display = "block";
    document.querySelector(".product-list").style.display = "none";
    clearErrorMessage();
}

function showProductList() {
    document.getElementById("product-form-container").style.display = "none";
    document.querySelector(".product-list").style.display = "block";
    fetchProdutos();
}

function handleCategoryChange() {
    const category = document.getElementById("product-category").value;
    const otherCategoryContainer = document.getElementById("other-category-container");
    otherCategoryContainer.style.display = category === "outros" ? "block" : "none";
}

function formatarValor(valor) {
    let partes = valor.split(",");
    if (partes.length === 1) return `${valor},00`;
    if (partes[1].length === 1) return `${partes[0]},${partes[1]}0`;
    return valor;
}

function clearForm() {
    if (confirm("Tem certeza que deseja cancelar o cadastro?")) {
        document.getElementById("product-form").reset();
        document.getElementById("other-category-container").style.display = "none";
        clearErrorMessage();
        produtoEditando = null;
        document.getElementById("product-description").disabled = false;
        showProductList();
    }
}

function clearErrorMessage() {
    document.getElementById("error-message").style.display = "none";
    document.getElementById("error-message").innerText = "";
}

function displayErrorMessage(message) {
    const errorMessage = document.getElementById("error-message");
    errorMessage.style.display = "block";
    errorMessage.innerText = message;
}

function isAlphabetic(input) {
    return /^[a-zA-ZáéíóúÁÉÍÓÚâêîôûÂÊÎÔÛãõÃÕçÇ\s]+$/.test(input);
}

async function handleFormSubmit(event) {
    event.preventDefault();

    const descricao = document.getElementById("product-description").value.trim();
    const valor = document.getElementById("product-value").value.trim();
    const categoria = document.getElementById("product-category").value;
    const outraCategoria = document.getElementById("other-category")?.value.trim();

    if (!descricao) {
        displayErrorMessage("Descrição é obrigatória.");
        return;
    }
    if (descricao.length > 40) {
        displayErrorMessage("Descrição deve ter no máximo 40 caracteres.");
        return;
    }
    
    if (produtos.some(p => p.descricao === descricao && produtoEditando !== p.id)) {
        displayErrorMessage("Já existe um produto com essa descrição.");
        return;
    }

    if (!valor.match(/^\d+(\,\d{1,2})?$/)) {
        displayErrorMessage("Valor inválido! Use o formato correto (ex: 1000,00).");
        return;
    }
    if (!categoria) {
        displayErrorMessage("Selecione uma categoria.");
        return;
    }
    if (categoria === "outros") {
        if (!outraCategoria || outraCategoria.length > 30) {
            displayErrorMessage("Categoria personalizada inválida ou muito longa.");
            return;
        }
        if (!isAlphabetic(outraCategoria)) {
            displayErrorMessage("A categoria personalizada só pode conter letras.");
            return;
        }
    }

    if (confirm("Deseja salvar o produto?")) {
        const valorFormatado = valor.replace(",", ".");
        const produto = {
            descricao: produtos.find(p => p.id === produtoEditando)?.descricao || descricao,
            valor: valorFormatado,
            categoria: categoria === "outros" ? outraCategoria : categoria
        };

        if (produtoEditando !== null) {
            await fetchUpdateProduto(produtoEditando, produto);
            produtoEditando = null;
        } else {
            await fetchAddProduto(produto);
        }

        document.getElementById("product-form").reset();
        document.getElementById("product-description").disabled = false;
        showProductList();
    }
}

document.addEventListener("DOMContentLoaded", fetchProdutos);
