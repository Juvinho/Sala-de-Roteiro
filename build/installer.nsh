; Visual de instalador de 1995: tela inteira com degradê azul atrás do assistente.
!macro customHeader
  BGFont "Times New Roman" 40 700
  BGGradient 0000A0 000010 FFFFFF
  BrandingText "Sala de Roteiro 95 · Instalação"
!macroend

!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Bem-vindo ao Programa de Instalação da Sala de Roteiro 95"
  !define MUI_WELCOMEPAGE_TEXT "Este programa vai instalar a Sala de Roteiro 95 no seu computador.$\r$\n$\r$\nRecomendamos fechar os outros programas antes de continuar.$\r$\n$\r$\nSeus roteiros ficam guardados em Documentos\Sala de Roteiro 95 e não são apagados se você desinstalar.$\r$\n$\r$\nClique em Avançar para continuar."
  !insertmacro MUI_PAGE_WELCOME
!macroend
