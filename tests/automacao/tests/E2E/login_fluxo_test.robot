# Aqui você escreve os testes em si, chamando os passos prontos.
# Onde você escreve os cenários de teste

*** Settings ***
Library    SeleniumLibrary
Resource   ../../resources/enviroments/env.resource
Resource   ../../steps/loginSteps.resource

Suite Setup    Abrir Navegador na Tela de Login
Suite Teardown  Fechar Navegador

*** Test Cases ***
Login Válido
    [Documentation]    Realiza login e verifica saudação na tela inicial
    Clicar No Botão da Tela De Introdução
    Preencher Credenciais    ${USER}    ${PASS}
    Clicar No Botão Do Login
    Verificar Sucesso No Login
