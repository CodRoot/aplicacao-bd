# models.py
from pydantic import BaseModel, Field


class DepositoRequest(BaseModel):
    valor: float = Field(gt=0, description="Valor do depósito (maior que zero)")


class RetiradaRequest(BaseModel):
    valor: float = Field(gt=0, description="Valor da retirada (maior que zero)")


class OrdemRequest(BaseModel):
    id_conta: int = Field(gt=0, description="ID da conta (inteiro > 0)")
    ticker: str = Field(min_length=1, max_length=10)
    quantidade: int = Field(gt=0, description="Quantidade de papéis (inteiro > 0)")

