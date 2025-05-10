import React, { useState, useEffect } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface EntradaTelefoneProps {
  className?: string;
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder?: string;
  desabilitado?: boolean;
  id?: string;
  obrigatorio?: boolean;
  nome?: string;
  aoFocar?: () => void;
  aoDesfocar?: () => void;
}

export const EntradaTelefone = React.forwardRef<HTMLInputElement, EntradaTelefoneProps>(
  (
    {
      className,
      valor,
      aoMudar,
      placeholder,
      desabilitado,
      id,
      obrigatorio,
      nome,
      aoFocar,
      aoDesfocar,
      ...props
    },
    ref
  ) => {
    const [codigoPais, setCodigoPais] = useState("55");
    const [numeroTelefone, setNumeroTelefone] = useState("");

    // Trata valor vindo do backend com possível formatação
    useEffect(() => {
      if (valor) {
        const valorLimpo = valor.replace(/\D/g, ""); // remove tudo que não for número

        if (valorLimpo.length >= 3) {
          const codigo = valorLimpo.slice(0, 2); // assume dois primeiros como código país
          const numero = valorLimpo.slice(2);

          setCodigoPais(codigo);
          setNumeroTelefone(numero);
        } else {
          setCodigoPais(valorLimpo);
          setNumeroTelefone("");
        }
      }
    }, [valor]);

    const aoMudarCodigoPais = (e: React.ChangeEvent<HTMLInputElement>) => {
      const novoCodigo = e.target.value.replace(/\D/g, "");
      setCodigoPais(novoCodigo);
      atualizarValorCompleto(novoCodigo, numeroTelefone);
    };

    const aoMudarNumero = (e: React.ChangeEvent<HTMLInputElement>) => {
      const novoNumero = e.target.value.replace(/\D/g, "");
      setNumeroTelefone(novoNumero);
      atualizarValorCompleto(codigoPais, novoNumero);
    };

    const atualizarValorCompleto = (codigo: string, numero: string) => {
      if (!codigo && numero) {
        aoMudar(numero);
      } else if (codigo && !numero) {
        aoMudar(codigo);
      } else {
        aoMudar(codigo + numero);
      }
    };

    return (
      <div className="space-y-1">
        <div className="flex w-full space-x-2">
          <div className="w-16">
            <Input
              className="text-center"
              value={codigoPais}
              onChange={aoMudarCodigoPais}
              placeholder="55"
              disabled={desabilitado}
            />
          </div>
          <div className="flex-1">
            <Input
              id={id}
              name={nome}
              className={cn(className)}
              value={numeroTelefone}
              onChange={aoMudarNumero}
              placeholder={placeholder || "Telefone"}
              disabled={desabilitado}
              required={obrigatorio}
              ref={ref}
              onFocus={aoFocar}
              onBlur={aoDesfocar}
              {...props}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Exemplo:
          <br />• 55 DDD999999999
        </p>
      </div>
    );
  }
);

EntradaTelefone.displayName = "EntradaTelefone";
