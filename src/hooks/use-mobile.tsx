
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(window.innerWidth < MOBILE_BREAKPOINT)

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Inicializa com o tamanho real
    handleResize();
    
    // Adiciona event listener para mudanças de tamanho
    window.addEventListener("resize", handleResize)
    
    // Em dispositivos móveis, verifica mais frequentemente
    const interval = setInterval(handleResize, 1000);
    
    return () => {
      window.removeEventListener("resize", handleResize)
      clearInterval(interval);
    }
  }, [])

  return isMobile
}
