
*** Settings ***
Library    SeleniumLibrary
Resource   ../../resources/enviroments/env.resource
Resource   ../../steps/introSteps.resource

Suite Setup     Abrir Navegador Na Página De Introdução
Suite Teardown  Fechar Navegador

*** Test Cases ***
Verificar componentes da tela de introdução
    [Documentation]    Verifica elementos da tela de introdução
    Verificar Titulo E Ícone Da Introdução
    Verificar Texto Da Introdução
    Verificar Botão De Introdução Está Habilitado
    Verificar Navegação Para Tela De Login

