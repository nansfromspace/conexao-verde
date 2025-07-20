# Onde ficam as ações (passos reutilizáveis)
# Aqui você escreve como fazer uma ação: tipo “abrir o navegador”, “fazer login”, “preencher formulário”. Assim, o teste fica mais limpo, só chamando os nomes das ações.

*** Settings ***
Library    SeleniumLibrary
Resource   ../resources/enviroments/env.resource
Resource   ../pages/loginPage.resource

*** Keywords ***
Abrir Navegador na Tela de Login
    Open Browser    ${URL}    chrome
    Maximize Browser Window
    Go To    ${URL}

Clicar No Botão da Tela De Introdução
    Wait Until Element Is Visible    ${botao_intro}
    Click Button    ${botao_intro}

 Preencher Credenciais
    [Arguments]    ${user}    ${pass}
    Scroll Element Into View    ${botao_login}
    Input Text    ${campo_email}    ${user}
    Input Text    ${campo_senha}    ${pass}

Clicar No Botão Do Login
    Click Button    ${botao_login}

Verificar Sucesso No Login
    Wait Until Element Is Visible    ${msg_boas_vindas}
    Element Should Contain    ${msg_boas_vindas}    Descubra projetos ambientais perto de você e comece a fazer a diferença

Fechar Navegador
    Close All Browsers

