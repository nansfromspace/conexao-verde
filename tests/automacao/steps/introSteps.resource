*** Settings ***
Library    SeleniumLibrary
Resource   ../pages/introPage.resource
Resource   ../resources/enviroments/env.resource

*** Keywords ***

Abrir Navegador Na Página De Introdução
    [Documentation]  Abre o navegador e acessa a URL inicial do sistema.
    Open Browser    ${URL}    chrome
    Maximize Browser Window
    Go To           ${URL}

Verificar Titulo E Ícone Da Introdução
    [Documentation]  Verifica se título e ícone estão visíveis
    Wait Until Element Is Visible   ${botao_intro}
    Element Should Be Visible       ${titulo_intro}
    ${texto_titulo}=    Get Text    ${titulo_intro}
    Should Be Equal As Strings      ${texto_titulo}    Conexão Verde
    Element Should Be Visible       ${icone_texto_intro}

Verificar Texto Da Introdução
    [Documentation]  Verifica se texto da introdução está correto e visível
    ${texto_introducao}=  Get Text    ${texto_intro}
    Should Be Equal As Strings        ${texto_introducao}    Do toque ao impacto, da ideia à ação: o verde da sua cidade passa por você.
    Element Should Be Visible         ${texto_intro}


Verificar Botão De Introdução Está Habilitado
    [Documentation]  Verifica se o botão da tela de introdução está visível e habilitado.
    Element Should Be Visible        ${botao_intro}
    Element Should Be Enabled        ${botao_intro}

Verificar Navegação Para Tela De Login
    [Documentation]  Clica no botão de introdução e verifica se o campo de e-mail da tela de login aparece.
    Click Element                    ${botao_intro}
    Scroll Element Into View         ${campo_email}

Fechar Navegador
    Close All Browsers
